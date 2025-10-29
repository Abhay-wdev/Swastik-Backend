import mongoose from "mongoose";

const baseAddressFields = {
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  label: { type: String, trim: true, default: "Home" },
  fullName: { type: String, required: true, trim: true },
  phone: { type: Number, required: true, trim: true },
  House_Number: { type: String, required: true, trim: true },
  street: { type: String, required: true, trim: true },
  addressLine2: { type: String, trim: true },
  landmark: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true, default: "India" },
  message: { type: String, trim: true },
  isDefault: { type: Boolean, default: false },
};

const userHomeAddressSchema = new mongoose.Schema(baseAddressFields, { timestamps: true });
 

  const UserHomeAddress = mongoose.model("UserHomeAddress", userHomeAddressSchema);
  export default UserHomeAddress;
 
