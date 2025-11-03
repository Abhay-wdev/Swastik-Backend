import express from "express";
import { createQuery, getAllQueries, replyToQuery } from "../controllers/contactController.js";
 import { protect } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/", createQuery); // user submit form
router.get("/",protect, allowRoles("admin", "seller", "manager"),   getAllQueries); // admin view all
router.post("/reply/:id",protect, allowRoles("admin", "seller", "manager"),   replyToQuery); // admin reply

export default router;
