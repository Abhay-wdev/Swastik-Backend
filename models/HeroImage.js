import mongoose from "mongoose";

const heroImageSchema = new mongoose.Schema({
  desktopImageUrl: {
    type: String,
    required: true,
  },
  mobileImageUrl: {
    type: String,
    required: false, // optional
  },
  link: {
    type: String,
    required: true,
  },
  sequence: {
    type: Number,
    default: 0, // for ordering
  },
}, {
  timestamps: true
});

export default mongoose.model("HeroImage", heroImageSchema);
