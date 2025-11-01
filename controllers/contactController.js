import Contact from "../models/contactModel.js";
import nodemailer from "nodemailer";

// ✅ Configure transporter (same as OTP)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// =============================
// 📩 User submits contact form
// =============================
export const createQuery = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Optional: Validate Indian mobile format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    // Create new contact query
    const newQuery = await Contact.create({ name, email, phone, message });

    res.status(201).json({
      message: "Query submitted successfully",
      query: newQuery,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================
// 📜 Admin view all queries
// =============================
export const getAllQueries = async (req, res) => {
  try {
    const queries = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json(queries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================
// 📤 Admin reply to a query
// =============================
export const replyToQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply) {
      return res.status(400).json({ message: "Reply message required" });
    }

    const query = await Contact.findById(id);
    if (!query) {
      return res.status(404).json({ message: "Query not found" });
    }

    // Send reply email to the user
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: query.email,
      subject: "Response from Dadi Maa Laddoo Team",
      text: `Hello ${query.name},

${reply}

📞 Contact Number: ${query.phone}

Regards,
Dadi Maa Laddoo Team`,
    });

    // Save reply info
    query.reply = reply;
    query.repliedBy = req.user?._id || null; // optional if auth exists
    query.repliedAt = new Date();
    await query.save();

    res.status(200).json({ message: "Reply sent successfully", query });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
