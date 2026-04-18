import pool from '../config/database.js';
import { saveBase64Image } from '../utils/imageUpload.js';

// =============================================
// PET MANAGEMENT (Store Inventory)
// =============================================

// GET /api/pets - Get all pets with filters
export const getAllPets = async (req, res) => {
  try {
    const { species, breed, available, search, minPrice, maxPrice, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT p.*, 
             GROUP_CONCAT(pi.image_url) as images
      FROM pets p
      LEFT JOIN pet_images pi ON p.pet_id = pi.pet_id
      WHERE 1=1
    `;
    const params = [];

    if (species) {
      query += ` AND p.species = ?`;
      params.push(species);
    }

    if (breed) {
      query += ` AND p.breed LIKE ?`;
      params.push(`%${breed}%`);
    }

    if (available === 'true') {
      query += ` AND p.is_available = TRUE`;
    } else if (available === 'false') {
      query += ` AND p.is_available = FALSE`;
    }

    if (search) {
      query += ` AND (p.name LIKE ? OR p.breed LIKE ? OR p.species LIKE ? OR p.description LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (minPrice) {
      query += ` AND p.price >= ?`;
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      query += ` AND p.price <= ?`;
      params.push(parseFloat(maxPrice));
    }

    query += ` GROUP BY p.pet_id ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [pets] = await pool.query(query, params);

    // Parse images string to array
    const petsWithImages = pets.map(pet => ({
      ...pet,
      images: pet.images ? pet.images.split(',') : []
    }));

    res.json({
      success: true,
      data: petsWithImages
    });
  } catch (error) {
    console.error('Get pets error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pets',
      error: error.message
    });
  }
};

// GET /api/pets/:id - Get pet by ID
export const getPetById = async (req, res) => {
  try {
    const { id } = req.params;

    const [pets] = await pool.query(
      `SELECT p.*, u.first_name as created_by_name
       FROM pets p
       LEFT JOIN users u ON p.created_by = u.user_id
       WHERE p.pet_id = ?`,
      [id]
    );

    if (pets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Get pet images
    const [images] = await pool.query(
      `SELECT * FROM pet_images WHERE pet_id = ? ORDER BY display_order`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...pets[0],
        images
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pet',
      error: error.message
    });
  }
};

// POST /api/pets - Create new pet (Admin/Staff only)
export const createPet = async (req, res) => {
  try {
    const { name, species, breed, age, gender, description, price, stock_quantity, is_available, image_url } = req.body;
    const created_by = req.user.userId;

    // Validate required fields (pet name is optional now)
    if (!species || !breed || !age || !gender || !price) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    let dbImageUrl = null;
    if (image_url && typeof image_url === 'string' && image_url.startsWith('data:image')) {
      try {
        const savedPath = await saveBase64Image(image_url, 'pets');
        if (savedPath) dbImageUrl = savedPath;
      } catch (err) {
        console.error('Error saving pet image:', err);
      }
    }

    const [result] = await pool.query(
      `INSERT INTO pets (name, species, breed, age, gender, description, price, stock_quantity, is_available, image_url, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, species, breed, age, gender, description || null, price, stock_quantity || 1, is_available !== false, dbImageUrl, created_by]
    );

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
       VALUES (?, 'CREATE', 'pet', ?, ?)`,
      [created_by, result.insertId, `Created pet: ${name}`]
    );

    res.status(201).json({
      success: true,
      message: 'Pet created successfully',
      data: { pet_id: result.insertId }
    });
  } catch (error) {
    console.error('Create pet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating pet',
      error: error.message
    });
  }
};

// PUT /api/pets/:id - Update pet (Admin/Staff only)
export const updatePet = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, species, breed, age, gender, description, price, stock_quantity, is_available, image_url, remove_image } = req.body;
    const shouldRemoveImage = remove_image === true || remove_image === 'true';

    // Check if pet exists
    const [existing] = await pool.query(`SELECT pet_id FROM pets WHERE pet_id = ?`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    let dbImageUrl = undefined; // keep existing when no new image and not removing
    if (image_url && typeof image_url === 'string' && image_url.startsWith('data:image')) {
      try {
        const savedPath = await saveBase64Image(image_url, 'pets');
        if (savedPath) dbImageUrl = savedPath;
      } catch (err) {
        console.error('Error saving pet image:', err);
      }
    }

    const setParts = [
      'name = COALESCE(?, name)',
      'species = COALESCE(?, species)',
      'breed = COALESCE(?, breed)',
      'age = COALESCE(?, age)',
      'gender = COALESCE(?, gender)',
      'description = COALESCE(?, description)',
      'price = COALESCE(?, price)',
      'stock_quantity = COALESCE(?, stock_quantity)',
      'is_available = COALESCE(?, is_available)',
    ];
    const params = [name, species, breed, age, gender, description, price, stock_quantity, is_available];

    if (dbImageUrl !== undefined) {
      setParts.push('image_url = ?');
      params.push(dbImageUrl);
    } else if (shouldRemoveImage) {
      setParts.push('image_url = NULL');
    }

    setParts.push('updated_at = NOW()');
    params.push(id);

    await pool.query(`UPDATE pets SET ${setParts.join(', ')} WHERE pet_id = ?`, params);

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
       VALUES (?, 'UPDATE', 'pet', ?, ?)`,
      [req.user.userId, id, `Updated pet ID: ${id}`]
    );

    res.json({
      success: true,
      message: 'Pet updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating pet',
      error: error.message
    });
  }
};

// DELETE /api/pets/:id - Delete pet (Admin/Staff only)
export const deletePet = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if pet exists
    const [existing] = await pool.query(`SELECT name FROM pets WHERE pet_id = ?`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Delete pet images first (cascade should handle this, but just in case)
    await pool.query(`DELETE FROM pet_images WHERE pet_id = ?`, [id]);
    
    // Delete pet
    await pool.query(`DELETE FROM pets WHERE pet_id = ?`, [id]);

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
       VALUES (?, 'DELETE', 'pet', ?, ?)`,
      [req.user.userId, id, `Deleted pet: ${existing[0].name}`]
    );

    res.json({
      success: true,
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting pet',
      error: error.message
    });
  }
};

// POST /api/pets/:id/images - Add pet image
export const addPetImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { image_url, is_primary, display_order } = req.body;

    if (!image_url) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    // If setting as primary, unset other primary images
    if (is_primary) {
      await pool.query(
        `UPDATE pet_images SET is_primary = FALSE WHERE pet_id = ?`,
        [id]
      );
    }

    const [result] = await pool.query(
      `INSERT INTO pet_images (pet_id, image_url, is_primary, display_order)
       VALUES (?, ?, ?, ?)`,
      [id, image_url, is_primary || false, display_order || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Image added successfully',
      data: { image_id: result.insertId }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding image',
      error: error.message
    });
  }
};

