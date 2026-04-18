// Role-Based Access Control Middleware

export const requireRole = (allowedRoles) => {
  // Support both array and spread arguments
  const roles = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles])
    .map((r) => String(r || '').trim().toLowerCase());
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = String(req.user.role || '').trim().toLowerCase();

    // Backward compatibility:
    // Legacy DBs may still have `staff` users that should behave as admin.
    const isStaffAllowedAsAdmin = userRole === 'staff' && roles.includes('admin');
    if (!roles.includes(userRole) && !isStaffAllowedAsAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Specific role checkers
export const requireCustomer = requireRole(['customer']);
export const requireDoctor = requireRole(['doctor']);
export const requireAdmin = requireRole(['admin', 'staff']);

