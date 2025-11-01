import PDFDocument from "pdfkit";
import Order from "../models/orderModel.js";
import Company from "../models/companyModal.js";
import fs from "fs";
import path from "path";
import axios from "axios";

export const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    // ✅ Fetch order and company
    const order = await Order.findById(orderId).populate("address");
    if (!order) return res.status(404).json({ message: "Order not found" });

    const company = await Company.findOne();
    if (!company)
      return res.status(404).json({ message: "Company details not found" });

    // ✅ Ensure invoices directory exists
    const invoiceDir = "invoices";
    if (!fs.existsSync(invoiceDir))
      fs.mkdirSync(invoiceDir, { recursive: true });

    const filePath = path.join(invoiceDir, `invoice_${orderId}.pdf`);
    
    // Use a font that supports the rupee symbol
    const doc = new PDFDocument({ 
      margin: 50,
      // You can specify a font that supports the rupee symbol
      // If you have a custom font, register it here
    });

    // Stream PDF to both file and response
    const fileStream = fs.createWriteStream(filePath);
    doc.pipe(fileStream);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // ===========================
    // HEADER SECTION (Logo + Info)
    // ===========================
    if (company.logo) {
      try {
        // If Cloudinary URL or online link
        if (company.logo.startsWith("http")) {
          const response = await axios.get(company.logo, {
            responseType: "arraybuffer",
          });
          const imgBuffer = Buffer.from(response.data, "base64");
          doc.image(imgBuffer, 50, 45, { width: 60 });
        } else {
          const localPath = path.join("public", company.logo);
          if (fs.existsSync(localPath)) {
            doc.image(localPath, 50, 45, { width: 60 });
          }
        }
      } catch (err) {
        console.warn("⚠️ Failed to load company logo:", err.message);
      }
    }

    doc.fontSize(20).text("INVOICE", 0, 50, { align: "right" }).moveDown(2);

    // ===========================
    // COMPANY DETAILS
    // ===========================
    doc.fontSize(10);
    if (company.name) doc.text(company.name, 50, 110);

    if (company.address) {
      const { street, city, state, country, postalCode } = company.address;
      const addressParts = [street, `${city}, ${state}`, `${country} - ${postalCode}`].filter(Boolean);
      addressParts.forEach((line) => doc.text(line));
    }

    if (company.email || company.phone) {
      const contactLine = [
        company.email ? `Email: ${company.email}` : "",
        company.phone ? `Phone: ${company.phone}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
      doc.text(contactLine);
    }

    if (company.website) doc.text(`Website: ${company.website}`);
    if (company.gstNumber) doc.text(`GST No: ${company.gstNumber}`);
    if (company.registrationYear)
      doc.text(`Est. Year: ${company.registrationYear}`);
    if (company.businessType)
      doc.text(`Business Type: ${company.businessType}`);

    // Directors
    if (company.directors?.length > 0) {
      doc.moveDown(0.3).text("Directors:", { underline: true });
      company.directors.forEach((d) => {
        doc.text(`- ${d.name}${d.designation ? ` (${d.designation})` : ""}`);
      });
    }

    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(1);

    // ===========================
    // CUSTOMER / ORDER INFO
    // ===========================
    doc.fontSize(12).text("Bill To:", 50, doc.y);
    const addr = order.address;
    doc
      .fontSize(11)
      .text(addr.fullName)
      .text(addr.street)
      .text(`${addr.city}, ${addr.state}`)
      .text(`${addr.country} - ${addr.postalCode}`)
      .text(`Phone: ${addr.phone}`)
      .moveDown(1.5);

    doc
      .fontSize(11)
      .text(`Order ID: ${order._id}`)
      .text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`)
      .text(`Status: ${order.orderStatus}`)
      .text(`Payment: ${order.paymentStatus}`)
      .moveDown(1.5);

    // ===========================
    // TABLE HEADER
    // ===========================
    const startY = doc.y;
    const tableTop = startY + 10;

    // Define rupee symbol text that works with PDFKit
    const rupeeSymbol = "Rs.";

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Item", 50, tableTop)
      .text("Qty", 250, tableTop)
      .text(`Price (${rupeeSymbol})`, 320, tableTop, { width: 90, align: "right" })
      .text(`Subtotal (${rupeeSymbol})`, 440, tableTop, { width: 90, align: "right" });

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // ===========================
    // TABLE BODY
    // ===========================
    let position = tableTop + 25;
    doc.font("Helvetica");
    order.items.forEach((item) => {
      doc
        .text(item.name || "Unnamed Product", 50, position)
        .text(item.quantity, 260, position)
        .text(item.discountPrice?.toFixed(2) || "0.00", 320, position, {
          width: 90,
          align: "right",
        })
        .text(item.subtotal?.toFixed(2) || "0.00", 440, position, {
          width: 90,
          align: "right",
        });
      position += 20;
    });

    doc.moveTo(50, position).lineTo(550, position).stroke();
    position += 10;

    // ===========================
    // TOTALS SECTION
    // ===========================
    // ===========================
// TOTALS SECTION
// ===========================
// Define positions for better alignment
const labelX = 350;
const amountX = 450;
const labelWidth = 80;
const amountWidth = 90;

// Subtotal
doc
  .font("Helvetica-Bold")
  .text("Subtotal:", labelX, position, { width: labelWidth, align: "right" })
  .text(`${rupeeSymbol}${order.totalPrice?.toFixed(2) || "0.00"}`, amountX, position, {
    width: amountWidth,
    align: "right",
  });
position += 20;

// Discount (if exists)
if (order.discount) {
  doc
    .font("Helvetica")
    .text("Discount:", labelX, position, { width: labelWidth, align: "right" })
    .text(`${rupeeSymbol}${order.discount.toFixed(2)}`, amountX, position, {
      width: amountWidth,
      align: "right",
    });
  position += 20;
}

// Grand Total
doc
  .font("Helvetica-Bold")
  .text("Grand Total:", labelX, position, { width: labelWidth, align: "right" })
  .text(`${rupeeSymbol}${order.grandTotal?.toFixed(2) || "0.00"}`, amountX, position, {
    width: amountWidth,
    align: "right",
  });
position += 30;
    doc.moveTo(50, position).lineTo(550, position).stroke();

    // ===========================
    // FOOTER (NOTE + SOCIAL LINKS)
    // ===========================
    doc.moveDown(2);
    doc
      .fontSize(10)
      .text(company.invoiceNote || "Thank you for your business!", {
        align: "center",
      })
      .moveDown(1);
 

    doc
      .moveDown(2)
      .fontSize(9)
      .text("This is a system-generated invoice, no signature required.", {
        align: "center",
      });

    doc.end();
    fileStream.on("finish", () => console.log("Invoice saved:", filePath));
  } catch (error) {
    console.error("Invoice error:", error);
    res.status(500).json({
      message: "Failed to generate invoice",
      error: error.message,
    });
  }
};