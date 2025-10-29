import express from "express";
import multerUpload from "../config/multer.js";
import {
  getHeroImages,
  uploadHeroImages,
  deleteHeroImage,
  updateHeroImage,
  reorderHeroImages,
} from "../controllers/heroImageController.js";

const router = express.Router();

router.get("/", getHeroImages);
router.post("/upload", multerUpload.array("images", 5), uploadHeroImages);
router.put("/reorder", reorderHeroImages);
router.put("/:id", updateHeroImage);
router.delete("/:id", deleteHeroImage);

export default router;