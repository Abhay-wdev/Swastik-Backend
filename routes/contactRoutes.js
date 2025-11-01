import express from "express";
import { createQuery, getAllQueries, replyToQuery } from "../controllers/contactController.js";
 

const router = express.Router();

router.post("/", createQuery); // user submit form
router.get("/",   getAllQueries); // admin view all
router.post("/reply/:id",   replyToQuery); // admin reply

export default router;
