import PDFDocument from "pdfkit";
import Order from "../models/orderModel.js";
import Company from "../models/companyModal.js";
import fs from "fs";
import path from "path";
import axios from "axios";
import sharp from "sharp";

// ✔ Universal image processor
async function loadUniversalImage(src) {
  try {
    let buffer;

    // Remote image
    if (src.startsWith("http")) {
      const res = await axios.get(src, { responseType: "arraybuffer" });
      buffer = Buffer.from(res.data);
    } 
    // Local image
    else {
      const local = path.resolve("public", src);
      if (fs.existsSync(local)) buffer = fs.readFileSync(local);
      else return null;
    }

    let meta = await sharp(buffer).metadata();
    // convert unsupported → PNG
    if (["webp", "avif", "svg", "tiff", "heic"].includes(meta.format)) {
      buffer = await sharp(buffer).png().toBuffer();
    }

    return buffer;
  } catch {
    return null;
  }
}

// =============================================================
export const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch Data
    const order = await Order.findById(orderId).populate("address");
    if (!order) return res.status(404).json({ message: "Order not found" });

    const company = await Company.findOne();
    if (!company) return res.status(404).json({ message: "Company details not found" });

    // Create invoices folder (Universal path)
    const invoiceDir = path.resolve("invoices");
    if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir, { recursive: true });

    const filePath = path.join(invoiceDir, `invoice_${orderId}.pdf`);

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    // Stream to file + browser
    const fileStream = fs.createWriteStream(filePath);
    doc.pipe(fileStream);

    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // ===============================
    // HEADER (Logo + Title)
    // ===============================
    if (company.logo) {
      const logoBuffer = await loadUniversalImage(company.logo);
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, 50, 45, { width: 60 });
        } catch {}
      }
    }

    doc.fontSize(20).text("INVOICE", 0, 50, { align: "right" }).moveDown(2);

    // ===============================
    // COMPANY INFO
    // ===============================
    doc.fontSize(10);

    if (company.name) doc.text(company.name, 50, 110);

    if (company.address) {
      const { street, city, state, country, postalCode } = company.address;
      [street, `${city}, ${state}`, `${country} - ${postalCode}`]
        .filter(Boolean)
        .forEach(line => doc.text(line));
    }

    if (company.email || company.phone) {
      doc.text(
        [company.email && `Email: ${company.email}`, company.phone && `Phone: ${company.phone}`]
          .filter(Boolean)
          .join(" | ")
      );
    }

    if (company.website) doc.text(`Website: ${company.website}`);
    if (company.gstNumber) doc.text(`GST No: ${company.gstNumber}`);
    if (company.registrationYear) doc.text(`Est. Year: ${company.registrationYear}`);
    if (company.businessType) doc.text(`Business Type: ${company.businessType}`);

    if (company.directors?.length) {
      doc.moveDown(0.3).text("Directors:", { underline: true });
      company.directors.forEach(d => {
        doc.text(`- ${d.name}${d.designation ? ` (${d.designation})` : ""}`);
      });
    }

    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(1);

    // ===============================
    // CUSTOMER / ORDER INFO
    // ===============================
    const addr = order.address;

    doc.fontSize(12).text("Bill To:", 50, doc.y);
    doc.fontSize(11)
      .text(addr.fullName)
      .text(addr.street)
      .text(`${addr.city}, ${addr.state}`)
      .text(`${addr.country} - ${addr.postalCode}`)
      .text(`Phone: ${addr.phone}`)
      .moveDown(1.5);

    doc.fontSize(11)
      .text(`Order ID: ${order._id}`)
      .text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`)
      .text(`Status: ${order.orderStatus}`)
      .text(`Payment: ${order.paymentStatus}`)
      .moveDown(1.5);

    // ===============================
    // TABLE HEADER
    // ===============================
    const startY = doc.y + 10;
    const rupeeSymbol = "Rs";

    doc.fontSize(11).font("Helvetica-Bold")
      .text("Item", 50, startY)
      .text("Qty", 250, startY)
      .text(`Price (${rupeeSymbol})`, 320, startY, { width: 90, align: "right" })
      .text(`Subtotal (${rupeeSymbol})`, 440, startY, { width: 90, align: "right" });

    doc.moveTo(50, startY + 15).lineTo(550, startY + 15).stroke();

    // ===============================
    // TABLE BODY
    // ===============================
    let position = startY + 25;
    const lineHeight = 16;
    const maxY = 700;
    const nameWidth = 180;

    doc.font("Helvetica");

    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i];

      const itemName = item.name || "Unnamed Product";
      const quantity = item.quantity || 0;
      const price = item.discountPrice?.toFixed(2) || "0.00";
      const subtotal = item.subtotal?.toFixed(2) || "0.00";

      const nameStart = position;
      doc.text(itemName, 50, nameStart, { width: nameWidth });

      const nameHeight = doc.y - nameStart;
      const rowHeight = Math.max(nameHeight, lineHeight);

      doc.text(String(quantity), 260, nameStart, { width: 40, align: "center" });
      doc.text(price, 320, nameStart, { width: 90, align: "right" });
      doc.text(subtotal, 440, nameStart, { width: 90, align: "right" });

      doc.moveTo(50, nameStart + rowHeight + 4).lineTo(550, nameStart + rowHeight + 4).strokeColor("#ddd").stroke();

      position += rowHeight + 8;

      if (position > maxY && i < order.items.length - 1) {
        doc.addPage();
        position = 50;

        doc.font("Helvetica-Bold")
          .text("Item", 50, position)
          .text("Qty", 250, position)
          .text(`Price (${rupeeSymbol})`, 320, position, { width: 90, align: "right" })
          .text(`Subtotal (${rupeeSymbol})`, 440, position, { width: 90, align: "right" });

        doc.moveTo(50, position + 15).lineTo(550, position + 15).stroke();
        position += 30;
        doc.font("Helvetica");
      }
    }

    doc.moveTo(50, position).lineTo(550, position).strokeColor("black").stroke();
    position += 10;

    // ===============================
    // TOTALS
    // ===============================
    const labelX = 350;
    const amountX = 450;

    doc.font("Helvetica-Bold")
      .text("Subtotal:", labelX, position, { width: 80, align: "right" })
      .text(`${rupeeSymbol} ${order.totalPrice?.toFixed(2)}`, amountX, position, { width: 90, align: "right" });

    position += 20;

    if (order.discount) {
      doc.font("Helvetica")
        .text("Discount:", labelX, position, { width: 80, align: "right" })
        .text(`${rupeeSymbol} ${order.discount.toFixed(2)}`, amountX, position, { width: 90, align: "right" });

      position += 20;
    }

    doc.font("Helvetica-Bold")
      .text("Grand Total:", labelX, position, { width: 80, align: "right" })
      .text(`${rupeeSymbol} ${order.grandTotal?.toFixed(2)}`, amountX, position, { width: 90, align: "right" });

    position += 30;

    doc.moveTo(50, position).lineTo(550, position).stroke();

    // ===============================
    // FOOTER
    // ===============================
    doc.moveDown(2);
    doc.fontSize(10)
      .text(company.invoiceNote || "Thank you for your business!", { align: "center" })
      .moveDown(1)
      .fontSize(9)
      .text("This is a system-generated invoice, no signature required.", { align: "center" });

    // finish
    doc.end();

    fileStream.on("finish", () => console.log("Invoice saved:", filePath));
  } catch (error) {
    console.error("INVOICE ERROR:", error);
    res.status(500).json({
      message: "Failed to generate invoice",
      error: error.message,
    });
  }
};
