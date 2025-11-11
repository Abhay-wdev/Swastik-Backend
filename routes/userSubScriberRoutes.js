import express from "express";
import {
  addSubscriber,
  getSubscribers,
  deleteSubscriber,
} from "../controllers/subscriberController.js";
import { protect } from "../middlewares/authMiddleware.js"; // JWT middleware
 
import { allowRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/", addSubscriber); // Public
router.get("/",protect, allowRoles("admin", "seller", "manager"), getSubscribers); // Admin protected
router.delete("/:id",protect, allowRoles("admin", "seller", "manager"), deleteSubscriber); // Admin protected

export default router;
