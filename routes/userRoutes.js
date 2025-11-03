import express from "express";
import upload from "../config/multer.js"; // Multer middleware for file uploads
import {
 
  loginUser,        // login controller
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  addToCart,
  addToWishlist,
  logoutUser,    
  updateUserStatus,   // logout controller
} from "../controllers/userController.js"; 
import { protect } from "../middlewares/authMiddleware.js"; // JWT middleware
 
import { allowRoles } from "../middlewares/roleMiddleware.js";
const router = express.Router();

// ---------------------------
// USER ROUTES
// ---------------------------

// Register / Create a new user
 

// Login user and get JWT token
router.post("/login", loginUser);

// Logout user
router.post("/logout",protect, logoutUser);

// Get all users (admin only)
router.get("/", getAllUsers);

// Get a single user by ID
router.get("/:userId", protect, getUserById);

// Update user by ID (allow image upload)
router.put("/update/:userId", protect, upload.single("image"), updateUser);


// Delete user by ID (admin only)
router.delete("/:userId", protect,allowRoles("admin", "seller", "manager"), deleteUser);

// Add product to user's cart
router.put("/:userId/cart", protect, addToCart);
router.patch("/:userId/status",protect, allowRoles("admin", "seller", "manager"), updateUserStatus);
// Add product to user's wishlist
router.put("/:userId/wishlist", protect, addToWishlist);

export default router;
