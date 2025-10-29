// middlewares/auth.js
export const authMiddleware = (req, res, next) => {
  // Example: use passport / jwt to set req.user
  // if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  next();
};

export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  next();
};
