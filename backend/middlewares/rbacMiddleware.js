export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};


export const enforceBaseScope = (req, res, next) => {

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  // Admin → global access
  if (req.user.role === "ADMIN") {
    return next();
  }

  // Base Commander → assigned base only
  if (req.user.role === "BASE_COMMANDER") {
    req.query.baseId = req.user.baseId;
  }

  next();
};