// middleware/authorizeRoles.js

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Assuming req.user is already set by your token middleware
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(401).json({ message: "Unauthorized: No role found" });
      }

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ message: "Access denied: Not authorized" });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: "Authorization failed", error: error.message });
    }
  };
};

export default authorizeRoles;
