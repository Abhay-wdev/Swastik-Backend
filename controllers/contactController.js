import Contact from "../models/contactModel.js";
import emailApi from "../config/brevo.js";

// =============================
// 📩 User submits contact form
// =============================
export const createQuery = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

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
// 📤 Admin reply to a query (with Brevo)
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

    // Prepare email content
    const emailData = {
      sender: {
        name: "suswastik Team",
        email: process.env.BREVO_EMAIL, // configured sender email
      },
      to: [{ email: query.email, name: query.name }],
      subject: "Response from suswastik Team",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <p>Dear <strong>${query.name}</strong>,</p>
          <p>${reply}</p>
          <p><strong>Contact Number:</strong> ${query.phone}</p>
          <br/>
          <p>Warm regards,</p>
          <p><strong>suswastik Team</strong></p>
        </div>
      `,
    };

    // Send email using Brevo
    await emailApi.sendTransacEmail(emailData);

    // Save reply info
    query.reply = reply;
    query.repliedBy = req.user?._id || null;
    query.repliedAt = new Date();
    await query.save();

    res.status(200).json({ message: "Reply sent successfully", query });
  } catch (error) {
    console.error("Brevo error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
