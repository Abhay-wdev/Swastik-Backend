import PDFDocument from "pdfkit";
import Order from "../models/orderModel.js";
import Company from "../models/companyModal.js";
import axios from "axios";
import sharp from "sharp";
import path from "path";
import fs from "fs";

export const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch order + company data
    const order = await Order.findById(orderId).populate("address");
    if (!order) return res.status(404).json({ message: "Order not found" });

    const company = await Company.findOne();
    if (!company) return res.status(404).json({ message: "Company details not found" });

    // VERCEL FIX: DO NOT write file
    const doc = new PDFDocument({ margin: 50 });

    // ✔ Tell browser to download the PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice_${orderId}.pdf`
    );

    // ✔ Stream PDF directly to client
    doc.pipe(res);

    // ===========================
    // HEADER + LOGO
    // ===========================
    if (company.logo) {
      try {
        let imageBuffer;

        if (company.logo.startsWith("http")) {
          const response = await axios.get(company.logo, { responseType: "arraybuffer" });
          const buffer = Buffer.from(response.data);
          const metadata = await sharp(buffer).metadata();

          imageBuffer =
            ["webp", "svg"].includes(metadata.format)
              ? await sharp(buffer).png().toBuffer()
              : buffer;
        } else {
          const localPath = path.join("public", company.logo);
          if (fs.existsSync(localPath)) {
            const buffer = fs.readFileSync(localPath);
            const metadata = await sharp(buffer).metadata();
            imageBuffer =
              ["webp", "svg"].includes(metadata.format)
                ? await sharp(buffer).png().toBuffer()
                : buffer;
          }
        }

        if (imageBuffer) {
          doc.image(imageBuffer, 50, 45, { width: 60 });
        }
      } catch (err) {
        console.warn("Logo load failed:", err.message);
      }
    }

    doc.fontSize(20).text("INVOICE", 0, 50, { align: "right" }).moveDown(2);

    // ===========================
    // COMPANY INFO
    // ===========================
    doc.fontSize(10);

    if (company.name) doc.text(company.name, 50, 110);

    if (company.address) {
      const { street, city, state, country, postalCode } = company.address;
      doc.text(street);
      doc.text(`${city}, ${state}`);
      doc.text(`${country} - ${postalCode}`);
    }

    if (company.email || company.phone) {
      doc.text(
        `${company.email ? "Email: " + company.email : ""}${
          company.email && company.phone ? " | " : ""
        }${company.phone ? "Phone: " + company.phone : ""}`
      );
    }

    if (company.website) doc.text(`Website: ${company.website}`);
    if (company.gstNumber) doc.text(`GST No: ${company.gstNumber}`);

    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(1);

    // ===========================
    // CUSTOMER INFO
    // ===========================
    const addr = order.address;

    doc.fontSize(12).text("Bill To:", 50, doc.y);
    doc.fontSize(11)
      .text(addr.fullName)
      .text(addr.street)
      .text(`${addr.city}, ${addr.state}`)
      .text(`${addr.country} - ${addr.postalCode}`)
      .text(`Phone: ${addr.phone}`)
      .moveDown(1.5);

    // ===========================
    // ORDER INFO
    // ===========================
    doc
      .text(`Order ID: ${order._id}`)
      .text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`)
      .text(`Status: ${order.orderStatus}`)
      .text(`Payment: ${order.paymentStatus}`)
      .moveDown(1.5);

    // ===========================
    // TABLE HEADER
    // ===========================
    const startY = doc.y + 10;
    const rupeeSymbol = "Rs";

    doc
      .font("Helvetica-Bold")
      .text("Item", 50, startY)
      .text("Qty", 250, startY)
      .text(`Price (${rupeeSymbol})`, 320, startY, { width: 90, align: "right" })
      .text(`Subtotal (${rupeeSymbol})`, 440, startY, { width: 90, align: "right" });

    doc.moveTo(50, startY + 15).lineTo(550, startY + 15).stroke();

    // ===========================
    // ORDER ITEMS
    // ===========================
    let position = startY + 25;

    doc.font("Helvetica");

    for (const item of order.items) {
      const name = item.name;
      const quantity = item.quantity;
      const price = Number(item.discountPrice || 0).toFixed(2);
      const subtotal = Number(item.subtotal || 0).toFixed(2);

      doc.text(name, 50, position, { width: 180 });
      doc.text(String(quantity), 260, position);
      doc.text(price, 320, position, { width: 90, align: "right" });
      doc.text(subtotal, 440, position, { width: 90, align: "right" });

      position += 20;

      if (position > 700) {
        doc.addPage();
        position = 50;
      }
    }

    doc.moveTo(50, position).lineTo(550, position).stroke();
    position += 20;

    // ===========================
    // TOTALS
    // ===========================
    doc.font("Helvetica-Bold")
      .text("Grand Total:", 350, position, { width: 100, align: "right" })
      .text(`${rupeeSymbol} ${order.grandTotal.toFixed(2)}`, 450, position, {
        width: 90,
        align: "right",
      });

    position += 40;

    // ===========================
    // FOOTER
    // ===========================
    doc
      .fontSize(10)
      .text(company.invoiceNote || "Thank you for your purchase!", {
        align: "center",
      });

    doc.end(); // 🚀 END STREAM (REQUIRED)
  } catch (error) {
    console.error("Invoice error:", error);
    res.status(500).json({ message: "Invoice generation failed", error: error.message });
  }
};
