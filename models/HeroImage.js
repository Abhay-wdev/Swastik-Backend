import mongoose from "mongoose";

const heroImageSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  link: { type: String, required: true },
  sequence: { type: Number, default: 0 }, // for ordering
});

export default mongoose.model("HeroImage", heroImageSchema);
