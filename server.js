import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";       // <-- import category routes
import subCategoryRoutes from "./routes/subCategoryRoutes.js"; // <-- import subcategory routes
import couponRoutes from "./routes/couponRoutes.js";
import  userShippingAddress  from "./routes/userShippingAddressRoutes.js"; 
import  userHomeAddress  from "./routes/userHomeAddressRoutes.js"; 
import orderItemRoutes from "./routes/orderItemRoutes.js";
import returnRoutes from "./routes/returnRoutes.js";
import orderHistoryRoutes from "./routes/orderHistoryRoutes.js";
import paymentAttemptRoutes from "./routes/paymentAttemptRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import auth from "./routes/auth.js";
import heroImageRoutes from "./routes/heroImageRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import videoProductRoutes from "./routes/videoProductRoutes.js";
import category from "./routes/category.js";
import testimonialsRouter from "./routes/testimonialsRoutes.js";
import distributorRoutes from "./routes/distributorRoutes.js";
import userSubScriberRoutes from "./routes/userSubScriberRoutes.js"
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect Database
connectDB();

// Routes
app.use("/products", productRoutes);
app.use("/categories", categoryRoutes);           // <-- add categories
app.use("/subcategories", subCategoryRoutes);     // <-- add subcategories
app.use("/user", userRoutes);
app.use("/reviews", reviewRoutes);
app.use("/orders", orderRoutes);
app.use("/coupons", couponRoutes);
app.use("/shippingaddress",userShippingAddress); 
app.use("/homeaddress",userHomeAddress); 
app.use("/order-item", orderItemRoutes);
app.use("/return", returnRoutes);
app.use("/order-history", orderHistoryRoutes);
app.use("/cart", cartRoutes);
app.use("/payment-attempt", paymentAttemptRoutes);
app.use("/hero", heroImageRoutes);
app.use("/auth", auth);
app.use("/blogs", blogRoutes);
app.use("/company", companyRoutes);
app.use("/contact", contactRoutes);
app.use("/videoproducts", videoProductRoutes);
app.use("/categoryCards", category);
app.use("/testimonials", testimonialsRouter);
app.use("/distributors", distributorRoutes);
app.use("/subscribers", userSubScriberRoutes );
app.get("/", (req, res) => res.send("API is running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
