import pool from '../config/database.js';
import { saveBase64Image } from '../utils/imageUpload.js';

// =============================================
// PRODUCT MANAGEMENT
// =============================================

// GET /api/products - Get all products with filters
export const getAllProducts = async (req, res) => {
  try {
    const { category, available, search, minPrice, maxPrice, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT p.*, 
             GROUP_CONCAT(pi.image_url) as images
      FROM products p
      LEFT JOIN product_images pi ON p.product_id = pi.product_id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      query += ` AND p.category = ?`;
      params.push(category);
    }

    if (available === 'true') {
      query += ` AND p.is_available = TRUE`;
    } else if (available === 'false') {
      query += ` AND p.is_available = FALSE`;
    }

    if (search) {
      query += ` AND (p.name LIKE ? OR p.category LIKE ? OR p.description LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (minPrice) {
      query += ` AND p.price >= ?`;
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      query += ` AND p.price <= ?`;
      params.push(parseFloat(maxPrice));
    }

    query += ` GROUP BY p.product_id ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [products] = await pool.query(query, params);

    // Parse images string to array
    const productsWithImages = products.map(product => ({
      ...product,
      images: product.images ? product.images.split(',') : []
    }));

    res.json({
      success: true,
      data: productsWithImages
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// GET /api/products/:id - Get product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.query(
      `SELECT p.*, u.first_name as created_by_name
       FROM products p
       LEFT JOIN users u ON p.created_by = u.user_id
       WHERE p.product_id = ?`,
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get product images
    const [images] = await pool.query(
      `SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...products[0],
        images
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

// GET /api/products/category/:category - Get products by category
export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const [products] = await pool.query(
      `SELECT p.*, 
              GROUP_CONCAT(pi.image_url) as images
       FROM products p
       LEFT JOIN product_images pi ON p.product_id = pi.product_id
       WHERE p.category = ? AND p.is_available = TRUE
       GROUP BY p.product_id
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [category, parseInt(limit), parseInt(offset)]
    );

    const productsWithImages = products.map(product => ({
      ...product,
      images: product.images ? product.images.split(',') : []
    }));

    res.json({
      success: true,
      data: productsWithImages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products by category',
      error: error.message
    });
  }
};

// POST /api/products - Create new product (Admin/Staff only)
export const createProduct = async (req, res) => {
  try {
    const { name, category, description, price, stock_quantity, is_available, image_url } = req.body;
    const created_by = req.user.userId;

    // Validate required fields
    if (!name || !category || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, and price are required'
      });
    }

    let dbImageUrl = null;
    if (image_url && typeof image_url === 'string' && image_url.startsWith('data:image')) {
      try {
        const savedPath = await saveBase64Image(image_url, 'products');
        if (savedPath) dbImageUrl = savedPath;
      } catch (err) {
        console.error('Error saving product image:', err);
      }
    }

    const [result] = await pool.query(
      `INSERT INTO products (name, category, description, price, stock_quantity, is_available, image_url, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category, description || null, price, stock_quantity || 0, is_available !== false, dbImageUrl, created_by]
    );

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
       VALUES (?, 'CREATE', 'product', ?, ?)`,
      [created_by, result.insertId, `Created product: ${name}`]
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product_id: result.insertId }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

// PUT /api/products/:id - Update product (Admin/Staff only)
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, description, price, stock_quantity, is_available, image_url, remove_image } = req.body;
    const shouldRemoveImage = remove_image === true || remove_image === 'true';

    // Check if product exists
    const [existing] = await pool.query(`SELECT product_id FROM products WHERE product_id = ?`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let dbImageUrl = undefined;
    if (image_url && typeof image_url === 'string' && image_url.startsWith('data:image')) {
      try {
        const savedPath = await saveBase64Image(image_url, 'products');
        if (savedPath) dbImageUrl = savedPath;
      } catch (err) {
        console.error('Error saving product image:', err);
      }
    }

    const setParts = [
      'name = COALESCE(?, name)',
      'category = COALESCE(?, category)',
      'description = COALESCE(?, description)',
      'price = COALESCE(?, price)',
      'stock_quantity = COALESCE(?, stock_quantity)',
      'is_available = COALESCE(?, is_available)',
    ];
    const params = [name, category, description, price, stock_quantity, is_available];

    if (dbImageUrl !== undefined) {
      setParts.push('image_url = ?');
      params.push(dbImageUrl);
    } else if (shouldRemoveImage) {
      setParts.push('image_url = NULL');
    }

    setParts.push('updated_at = NOW()');
    params.push(id);

    await pool.query(`UPDATE products SET ${setParts.join(', ')} WHERE product_id = ?`, params);

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
       VALUES (?, 'UPDATE', 'product', ?, ?)`,
      [req.user.userId, id, `Updated product ID: ${id}`]
    );

    res.json({
      success: true,
      message: 'Product updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};

// DELETE /api/products/:id - Delete product (Admin/Staff only)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const [existing] = await pool.query(`SELECT name FROM products WHERE product_id = ?`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete product images first
    await pool.query(`DELETE FROM product_images WHERE product_id = ?`, [id]);
    
    // Delete product
    await pool.query(`DELETE FROM products WHERE product_id = ?`, [id]);

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
       VALUES (?, 'DELETE', 'product', ?, ?)`,
      [req.user.userId, id, `Deleted product: ${existing[0].name}`]
    );

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

