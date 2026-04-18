import pool from '../config/database.js';
import { createUserByStaff } from '../services/authService.js';
import { createUserByStaffSchema } from '../utils/validators.js';

// =============================================
// DASHBOARD STATISTICS
// =============================================

// GET /api/admin/dashboard
export const getDashboardStats = async (req, res) => {
  try {
    // Get today's date boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    // Get week start (7 days ago)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    
    // Get month start
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Total sales today
    const [todaySales] = await pool.query(
      `SELECT COALESCE(SUM(final_amount), 0) as total 
       FROM orders 
       WHERE created_at >= ? AND created_at <= ? AND payment_status = 'paid'`,
      [today, todayEnd]
    );

    // Total sales this week
    const [weekSales] = await pool.query(
      `SELECT COALESCE(SUM(final_amount), 0) as total 
       FROM orders 
       WHERE created_at >= ? AND payment_status = 'paid'`,
      [weekStart]
    );

    // Total sales this month
    const [monthSales] = await pool.query(
      `SELECT COALESCE(SUM(final_amount), 0) as total 
       FROM orders 
       WHERE created_at >= ? AND payment_status = 'paid'`,
      [monthStart]
    );

    // Total orders count
    const [totalOrders] = await pool.query(
      `SELECT COUNT(*) as count FROM orders`
    );

    // Active customers (users with role customer and is_active)
    const [activeCustomers] = await pool.query(
      `SELECT COUNT(*) as count FROM users WHERE LOWER(TRIM(role)) = 'customer' AND is_active = TRUE`
    );

    // Pending appointments
    const [pendingAppointments] = await pool.query(
      `SELECT COUNT(*) as count FROM appointments WHERE status = 'pending'`
    );

    // Pending exchange requests
    const [pendingExchanges] = await pool.query(
      `SELECT COUNT(*) as count FROM exchange_requests WHERE status = 'pending'`
    );

    res.json({
      success: true,
      data: {
        totalSales: {
          today: todaySales[0].total || 0,
          week: weekSales[0].total || 0,
          month: monthSales[0].total || 0
        },
        totalOrders: totalOrders[0].count || 0,
        activeCustomers: activeCustomers[0].count || 0,
        pendingAppointments: pendingAppointments[0].count || 0,
        pendingExchanges: pendingExchanges[0].count || 0
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};

// GET /api/admin/dashboard/chart - Chart data for last 7 days (sales & orders per day)
export const getDashboardChartData = async (req, res) => {
  try {
    const [daily] = await pool.query(
      `SELECT DATE(created_at) as date,
              COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN final_amount ELSE 0 END), 0) as sales,
              COUNT(*) as orders
       FROM orders
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    const salesByDay = daily.map((r) => ({
      date: String(r.date).slice(0, 10),
      sales: Number(r.sales),
      orders: r.orders || 0
    }));

    res.json({
      success: true,
      data: { salesByDay }
    });
  } catch (error) {
    console.error('Dashboard chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chart data',
      error: error.message
    });
  }
};

// =============================================
// USER MANAGEMENT
// =============================================

// GET /api/admin/users
export const getAllUsers = async (req, res) => {
  try {
    const { role, status, verified, search, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT user_id, first_name, last_name, email, phone, role, 
             is_active, is_verified, email_verified_at, created_at, updated_at
      FROM users 
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ` AND role = ?`;
      params.push(role);
    }

    if (status === 'active') {
      query += ` AND is_active = TRUE`;
    } else if (status === 'inactive') {
      query += ` AND is_active = FALSE`;
    }

    if (verified === 'true') {
      query += ` AND is_verified = TRUE`;
    } else if (verified === 'false') {
      query += ` AND is_verified = FALSE`;
    }

    if (search) {
      query += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [users] = await pool.query(query, params);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// GET /api/admin/users/:id
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [users] = await pool.query(
      `SELECT user_id, first_name, last_name, email, phone, role, 
              is_active, is_verified, email_verified_at, created_at, updated_at
       FROM users WHERE user_id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// POST /api/admin/users - Create user (admin); sends credentials to email
export const createUser = async (req, res) => {
  try {
    const validatedData = createUserByStaffSchema.parse(req.body);
    const result = await createUserByStaff(validatedData);

    // Log that this user account was created by an admin.
    // This is later used at login time to allow exactly one pre-verification login.
    try {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
         VALUES (?, 'CREATE_ADMIN_USER', 'user', ?, ?)`,
        [req.user.userId, result.userId, `Admin created user account: ${result.email}`]
      );
    } catch (logError) {
      console.error('Failed to log admin user creation:', logError);
    }

    res.status(201).json({
      success: true,
      message: 'Account created. Credentials and a verification OTP have been sent to the user\'s email. They must verify before logging in.',
      data: result
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      const errors = {};
      error.errors.forEach((e) => {
        const key = e.path?.[0];
        if (key) errors[key] = e.message;
      });
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    if (error.message === 'Email already registered') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating user'
    });
  }
};

// PUT /api/admin/users/:id/status
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    await pool.query(
      `UPDATE users SET is_active = ?, updated_at = NOW() WHERE user_id = ?`,
      [is_active, id]
    );

    // Log the action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
       VALUES (?, 'UPDATE_STATUS', 'user', ?, ?)`,
      [req.user.userId, id, `User status changed to ${is_active ? 'active' : 'inactive'}`]
    );

    res.json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message
    });
  }
};

// PUT /api/admin/users/:id/role
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['customer', 'doctor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Get old role for logging
    const [oldUser] = await pool.query(`SELECT role FROM users WHERE user_id = ?`, [id]);
    
    await pool.query(
      `UPDATE users SET role = ?, updated_at = NOW() WHERE user_id = ?`,
      [role, id]
    );

    // If changing to admin, ensure staff profile row exists (internal profile table)
    if (role === 'admin') {
      const [existingStaff] = await pool.query(
        'SELECT staff_id FROM staff WHERE user_id = ?',
        [id]
      );
      if (existingStaff.length === 0) {
        await pool.query('INSERT INTO staff (user_id) VALUES (?)', [id]);
      }
    }

    // If changing to doctor, create doctor record if not exists
    if (role === 'doctor') {
      const [existingDoctor] = await pool.query(
        `SELECT doctor_id FROM doctors WHERE user_id = ?`, [id]
      );
      if (existingDoctor.length === 0) {
        await pool.query(
          `INSERT INTO doctors (user_id, specialization, consultation_fee) VALUES (?, 'General', 1500)`,
          [id]
        );
      }
    }

    // If changing to customer, create customer record if not exists
    if (role === 'customer') {
      const [existingCustomer] = await pool.query(
        `SELECT customer_id FROM customers WHERE user_id = ?`, [id]
      );
      if (existingCustomer.length === 0) {
        await pool.query(
          `INSERT INTO customers (user_id) VALUES (?)`,
          [id]
        );
      }
    }

    // Log the action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
       VALUES (?, 'UPDATE_ROLE', 'user', ?, ?)`,
      [req.user.userId, id, `User role changed from ${oldUser[0]?.role} to ${role}`]
    );

    res.json({
      success: true,
      message: 'User role updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user role',
      error: error.message
    });
  }
};

// =============================================
// REPORTS
// =============================================

// GET /api/admin/reports/:type
export const getReport = async (req, res) => {
  try {
    const { type } = req.params;
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Date range required (from and to)'
      });
    }

    let reportData = {};

    switch (type) {
      case 'sales':
        reportData = await getSalesReport(from, to);
        break;
      case 'appointments':
        reportData = await getAppointmentsReport(from, to);
        break;
      case 'customers':
        reportData = await getCustomersReport(from, to);
        break;
      case 'loyalty':
        reportData = await getLoyaltyReport(from, to);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error.message
    });
  }
};

// Helper function for sales report
const getSalesReport = async (from, to) => {
  const [totalSales] = await pool.query(
    `SELECT COALESCE(SUM(final_amount), 0) as totalSales,
            COUNT(*) as totalOrders,
            COALESCE(AVG(final_amount), 0) as averageOrderValue
     FROM orders 
     WHERE created_at BETWEEN ? AND ? AND payment_status = 'paid'`,
    [from, to]
  );

  // Get previous period for growth calculation
  const daysDiff = Math.max(1, Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)));
  const prevFrom = new Date(from);
  prevFrom.setDate(prevFrom.getDate() - daysDiff);
  
  const [prevSales] = await pool.query(
    `SELECT COALESCE(SUM(final_amount), 0) as total
     FROM orders 
     WHERE created_at BETWEEN ? AND ? AND payment_status = 'paid'`,
    [prevFrom.toISOString().split('T')[0], from]
  );

  const growth = prevSales[0].total > 0 
    ? ((totalSales[0].totalSales - prevSales[0].total) / prevSales[0].total * 100).toFixed(1)
    : (totalSales[0].totalSales > 0 ? 100 : 0);

  // Top products with current stock
  const [topProducts] = await pool.query(
    `SELECT oi.item_name as name, 
            oi.item_id,
            oi.item_type,
            SUM(oi.subtotal) as sales, 
            COUNT(*) as orders,
            SUM(oi.quantity) as quantity,
            CASE 
              WHEN oi.item_type = 'pet' THEN (SELECT stock_quantity FROM pets WHERE pet_id = oi.item_id)
              ELSE (SELECT stock_quantity FROM products WHERE product_id = oi.item_id)
            END as current_stock
     FROM order_items oi
     JOIN orders o ON o.order_id = oi.order_id
     WHERE o.created_at BETWEEN ? AND ? AND o.payment_status = 'paid'
     GROUP BY oi.item_name, oi.item_id, oi.item_type
     ORDER BY sales DESC
     LIMIT 5`,
    [from, to]
  );

  // Daily Revenue Trends
  const [revenueTrend] = await pool.query(
    `SELECT DATE(created_at) as date, 
            COALESCE(SUM(final_amount), 0) as sales,
            COUNT(*) as orders
     FROM orders
     WHERE created_at BETWEEN ? AND ? AND payment_status = 'paid'
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [from, to]
  );

  // Product Trends (Top 5 products daily quantity)
  const productTrends = [];
  if (topProducts.length > 0) {
    const topProductNames = topProducts.map(p => p.name);
    const [productDaily] = await pool.query(
      `SELECT DATE(o.created_at) as date,
              oi.item_name as name,
              SUM(oi.quantity) as quantity
       FROM order_items oi
       JOIN orders o ON o.order_id = oi.order_id
       WHERE o.created_at BETWEEN ? AND ? 
       AND o.payment_status = 'paid'
       AND oi.item_name IN (?)
       GROUP BY DATE(o.created_at), oi.item_name
       ORDER BY date ASC`,
      [from, to, topProductNames]
    );

    // Format for easier frontend consumption
    topProductNames.forEach(name => {
      const data = productDaily
        .filter(p => p.name === name)
        .map(p => ({ 
          date: String(p.date).slice(0, 10), 
          quantity: Number(p.quantity) || 0 
        }));
      productTrends.push({ name, data });
    });
  }

  return {
    totalSales: totalSales[0].totalSales,
    totalOrders: totalSales[0].totalOrders,
    averageOrderValue: Math.round(totalSales[0].averageOrderValue),
    growth: parseFloat(growth),
    topProducts,
    revenueTrend: revenueTrend.map(r => ({
      date: String(r.date).slice(0, 10),
      sales: Number(r.sales),
      orders: r.orders || 0
    })),
    productTrends
  };
};

// Helper function for appointments report
const getAppointmentsReport = async (from, to) => {
  const [stats] = await pool.query(
    `SELECT 
       COUNT(*) as totalAppointments,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
     FROM appointments
     WHERE created_at BETWEEN ? AND ?`,
    [from, to]
  );

  // Top doctors
  const [topDoctors] = await pool.query(
    `SELECT CONCAT(u.first_name, ' ', u.last_name) as name,
            COUNT(*) as appointments
     FROM appointments a
     JOIN doctors d ON d.doctor_id = a.doctor_id
     JOIN users u ON u.user_id = d.user_id
     WHERE a.created_at BETWEEN ? AND ?
     GROUP BY d.doctor_id, u.first_name, u.last_name
     ORDER BY appointments DESC
     LIMIT 5`,
    [from, to]
  );

  // Growth: compare to previous period
  const daysDiff = Math.max(1, Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)));
  const prevFrom = new Date(from);
  prevFrom.setDate(prevFrom.getDate() - daysDiff);
  const prevFromStr = prevFrom.toISOString().split('T')[0];
  const [prevStats] = await pool.query(
    `SELECT COUNT(*) as total FROM appointments WHERE created_at BETWEEN ? AND ?`,
    [prevFromStr, from]
  );
  const prevTotal = prevStats[0]?.total || 0;
  const currentTotal = stats[0].totalAppointments || 0;
  const growth = prevTotal > 0 ? parseFloat((((currentTotal - prevTotal) / prevTotal) * 100).toFixed(1)) : 0;

  return {
    totalAppointments: currentTotal,
    completed: stats[0].completed || 0,
    cancelled: stats[0].cancelled || 0,
    pending: stats[0].pending || 0,
    growth,
    topDoctors
  };
};

// Helper function for customers report
const getCustomersReport = async (from, to) => {
  const [totalCustomers] = await pool.query(
    `SELECT COUNT(*) as count FROM users WHERE LOWER(TRIM(role)) = 'customer'`
  );

  const [newCustomers] = await pool.query(
    `SELECT COUNT(*) as count FROM users 
     WHERE LOWER(TRIM(role)) = 'customer' AND created_at BETWEEN ? AND ?`,
    [from, to]
  );

  const [activeCustomers] = await pool.query(
    `SELECT COUNT(*) as count FROM users 
     WHERE LOWER(TRIM(role)) = 'customer' AND is_active = TRUE`
  );

  // Customer segments by loyalty tier
  const [segments] = await pool.query(
    `SELECT loyalty_tier as segment, COUNT(*) as count
     FROM customers
     GROUP BY loyalty_tier`
  );

  // Growth: new customers vs previous period
  const daysDiff = Math.max(1, Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)));
  const prevFrom = new Date(from);
  prevFrom.setDate(prevFrom.getDate() - daysDiff);
  const prevFromStr = prevFrom.toISOString().split('T')[0];
  const [prevNew] = await pool.query(
    `SELECT COUNT(*) as count FROM users WHERE LOWER(TRIM(role)) = 'customer' AND created_at BETWEEN ? AND ?`,
    [prevFromStr, from]
  );
  const prevNewCount = prevNew[0]?.count || 0;
  const newCount = newCustomers[0].count || 0;
  const growth = prevNewCount > 0 ? parseFloat((((newCount - prevNewCount) / prevNewCount) * 100).toFixed(1)) : (newCount > 0 ? 100 : 0);

  return {
    totalCustomers: totalCustomers[0].count || 0,
    newCustomers: newCount,
    activeCustomers: activeCustomers[0].count || 0,
    growth,
    topSegments: segments.length > 0 ? segments : [
      { segment: 'Bronze', count: 0 },
      { segment: 'Silver', count: 0 },
      { segment: 'Gold', count: 0 }
    ]
  };
};

// Helper function for loyalty report
const getLoyaltyReport = async (from, to) => {
  const [totalPoints] = await pool.query(
    `SELECT COALESCE(SUM(loyalty_points), 0) as total FROM customers`
  );

  const [activeMembers] = await pool.query(
    `SELECT COUNT(*) as count FROM customers WHERE loyalty_points > 0`
  );

  const [pointsRedeemed] = await pool.query(
    `SELECT COALESCE(SUM(loyalty_points_used), 0) as total
     FROM orders WHERE created_at BETWEEN ? AND ?`,
    [from, to]
  );

  // Loyalty tiers
  const [tiers] = await pool.query(
    `SELECT loyalty_tier as tier, COUNT(*) as members
     FROM customers
     GROUP BY loyalty_tier
     ORDER BY FIELD(loyalty_tier, 'platinum', 'gold', 'silver', 'bronze')`
  );

  // Growth: points redeemed vs previous period
  const daysDiff = Math.max(1, Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)));
  const prevFrom = new Date(from);
  prevFrom.setDate(prevFrom.getDate() - daysDiff);
  const prevFromStr = prevFrom.toISOString().split('T')[0];
  const [prevRedeemed] = await pool.query(
    `SELECT COALESCE(SUM(loyalty_points_used), 0) as total FROM orders WHERE created_at BETWEEN ? AND ?`,
    [prevFromStr, from]
  );
  const prevTotal = Number(prevRedeemed[0]?.total) || 0;
  const currentTotal = Number(pointsRedeemed[0].total) || 0;
  const growth = prevTotal > 0 ? parseFloat((((currentTotal - prevTotal) / prevTotal) * 100).toFixed(1)) : (currentTotal > 0 ? 100 : 0);

  return {
    totalPoints: totalPoints[0].total || 0,
    activeMembers: activeMembers[0].count || 0,
    pointsRedeemed: currentTotal,
    growth,
    topTiers: tiers.length > 0 ? tiers : [
      { tier: 'Platinum', members: 0 },
      { tier: 'Gold', members: 0 },
      { tier: 'Silver', members: 0 },
      { tier: 'Bronze', members: 0 }
    ]
  };
};

// GET /api/admin/reports/:type/export
export const exportReport = async (req, res) => {
  try {
    const { type } = req.params;
    const { from, to, format } = req.query;

    if (!from || !to) {
      return res.status(400).json({ success: false, message: 'Date range (from, to) required' });
    }

    const ext = format === 'pdf' ? 'pdf' : 'csv';
    let reportData = {};
    switch (type) {
      case 'sales':
        reportData = await getSalesReport(from, to);
        break;
      case 'appointments':
        reportData = await getAppointmentsReport(from, to);
        break;
      case 'customers':
        reportData = await getCustomersReport(from, to);
        break;
      case 'loyalty':
        reportData = await getLoyaltyReport(from, to);
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid report type' });
    }

    // Build CSV (PDF would require a library; CSV works for all formats request)
    const escapeCsv = (v) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = [];

    if (type === 'sales') {
      rows.push('Sales Report', `From,${from},To,${to}`);
      rows.push('Total Sales,Total Orders,Average Order,Growth %');
      rows.push([reportData.totalSales, reportData.totalOrders, reportData.averageOrderValue, reportData.growth].join(','));
      rows.push('');
      rows.push('Top Products', 'Name,Sales,Orders');
      (reportData.topProducts || []).forEach((p) => rows.push([escapeCsv(p.name), p.sales, p.orders].join(',')));
    } else if (type === 'appointments') {
      rows.push('Appointments Report', `From,${from},To,${to}`);
      rows.push('Total,Completed,Cancelled,Pending,Growth %');
      rows.push([reportData.totalAppointments, reportData.completed, reportData.cancelled, reportData.pending, reportData.growth].join(','));
      rows.push('');
      rows.push('Top Doctors', 'Name,Appointments');
      (reportData.topDoctors || []).forEach((d) => rows.push([escapeCsv(d.name), d.appointments].join(',')));
    } else if (type === 'customers') {
      rows.push('Customers Report', `From,${from},To,${to}`);
      rows.push('Total Customers,New (period),Active,Growth %');
      rows.push([reportData.totalCustomers, reportData.newCustomers, reportData.activeCustomers, reportData.growth].join(','));
      rows.push('');
      rows.push('By Tier', 'Segment,Count');
      (reportData.topSegments || []).forEach((s) => rows.push([escapeCsv(s.segment), s.count].join(',')));
    } else if (type === 'loyalty') {
      rows.push('Loyalty Report', `From,${from},To,${to}`);
      rows.push('Total Points,Active Members,Points Redeemed,Growth %');
      rows.push([reportData.totalPoints, reportData.activeMembers, reportData.pointsRedeemed, reportData.growth].join(','));
      rows.push('');
      rows.push('By Tier', 'Tier,Members');
      (reportData.topTiers || []).forEach((t) => rows.push([escapeCsv(t.tier), t.members].join(',')));
    }

    const csv = rows.join('\n');
    const filename = `${type}-report-${from}-to-${to}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting report',
      error: error.message
    });
  }
};

