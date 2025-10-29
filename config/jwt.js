import jwt from "jsonwebtoken";

const JWT_SECRET = "your_super_secret_key"; // move to .env in production
const JWT_EXPIRES_IN = "7d"; // token expires in 7 days

export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
