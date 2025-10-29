// middlewares/roleMiddleware.js
export const allowRoles = (...roles) => {
  return (req, res, next) => {
    // Assuming req.user is already populated by your JWT auth middleware
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    next();
  };
};
