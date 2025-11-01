import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    logo: {
      type: String, // Cloudinary or image URL
      default: "",
    },
    email: {
      type: String,
      required: [true, "Company email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    phone: {
      type: String,
      required: [true, "Company phone number is required"],
      trim: true,
    },
    address: {
      street: { 
        type: String, 
        required: [true, "Street address is required"],
        trim: true 
      },
      city: { 
        type: String, 
        required: [true, "City is required"],
        trim: true 
      },
      state: { 
        type: String, 
        required: [true, "State is required"],
        trim: true 
      },
      country: { 
        type: String, 
        required: [true, "Country is required"],
        trim: true 
      },
      postalCode: { 
        type: String, 
        required: [true, "Postal code is required"],
        trim: true 
      },
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    registrationYear: {
      type: Number,
      min: [1800, "Registration year must be after 1800"],
      max: [new Date().getFullYear(), "Registration year cannot be in the future"],
    },
    directors: [
      {
        name: { 
          type: String, 
          required: [true, "Director name is required"],
          trim: true 
        },
        designation: { 
          type: String, 
          default: "Director",
          trim: true 
        },
      },
    ],
    businessType: {
      type: String,
      enum: {
        values: [
          "Private Limited",
          "Public Limited",
          "LLP",
          "Partnership",
          "Proprietorship",
          "Other",
          "" // Allow empty string as well
        ],
        message: "{VALUE} is not a valid business type",
      },
      default: "Other",
    },
    website: {
      type: String,
      trim: true,
      match: [
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
        "Please provide a valid website URL",
      ],
    },
    socialLinks: [
      {
        logoimage: { 
          type: String,
          trim: true 
        },
        social: { 
          type: String,
          trim: true 
        },
        link: { 
          type: String,
          trim: true 
        },
      },
    ],
    invoiceNote: {
      type: String,
      default: "Thank you for your business!",
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ✅ Index for faster queries
companySchema.index({ name: 1 });
companySchema.index({ email: 1 });

// ✅ Pre-save middleware to clean up empty values
companySchema.pre('save', function(next) {
  // Remove empty directors
  if (this.directors && Array.isArray(this.directors)) {
    this.directors = this.directors.filter(dir => dir.name && dir.name.trim() !== '');
  }
  
  // Remove empty social links
  if (this.socialLinks && Array.isArray(this.socialLinks)) {
    this.socialLinks = this.socialLinks.filter(
      link => link.social || link.link || link.logoimage
    );
  }
  
  next();
});

const Company = mongoose.model("Company", companySchema);
export default Company;