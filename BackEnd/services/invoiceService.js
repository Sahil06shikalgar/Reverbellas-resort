import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import { calculateBookingFinancials } from "./billingService.js";

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(n || 0));

const pad = (n, size) => String(n).padStart(size, "0");

export const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Booking.countDocuments();
  return `RB-INV-${year}-${pad(count + 1, 6)}`;
};

export const buildInvoiceData = async (bookingId) => {
  const booking = await Booking.findById(bookingId)
    .populate("customer")
    .populate("property");

  if (!booking) return null;

  const fin = await calculateBookingFinancials(booking);

  const roomCharges = Number(
    (booking.pricing || {}).ratePerNight || 0
  );

  const lineItems = [
    {
      description: `${booking.property.name} · ${
        (booking.pricing || {}).nights || 1
      } night(s) @ ₹${roomCharges}/night`,
      quantity: (booking.pricing || {}).nights || 1,
      rate: roomCharges,
      amount: Number((booking.pricing || {}).baseAmount || 0)
    }
  ];

  for (const s of booking.services || []) {
    lineItems.push({
      description: s.description,
      quantity: Number(s.quantity || 1),
      rate: Number(s.rate || 0),
      amount: Number(s.amount || 0)
    });
  }

  return {
    invoiceNumber: await generateInvoiceNumber(),
    bookingNumber: booking.bookingCode,
    invoiceDate: new Date(),
    customer: booking.customer,
    property: booking.property,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    adults: booking.adults,
    children: booking.children,
    lineItems,
    roomCharges: fin.baseAmount,
    servicesTotal: fin.servicesTotal,
    discount: fin.discountAmount,
    tax: fin.tax,
    otherCharges: fin.otherCharges,
    grandTotal: fin.grandTotal,
    paidAmount: fin.totalPaid,
    pendingAmount: fin.balance,
    payments: fin.payments
  };
};

export const buildInvoicePdfBuffer = async (invoiceData) => {
  const PDFDocument = (await import("pdfkit")).default;
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  const chunks = [];
  doc.on("data", (c) => chunks.push(c));

  return new Promise((resolve, reject) => {
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    const render = () => {
      const { customer, property, bookingNumber, checkIn } = invoiceData;

      doc.fontSize(20).fillColor("#162019").text("Riverbells Resort", {
        align: "center"
      });
      doc.fontSize(10).fillColor("#6B7280").text("Invoice", {
        align: "center"
      });
      doc.moveDown();

      doc
        .fontSize(11)
        .fillColor("#162019")
        .text(`Invoice #: ${invoiceData.invoiceNumber}`, {
          align: "right"
        })
        .text(`Booking #: ${bookingNumber}`, { align: "right" })
        .text(
          `Date: ${new Date(invoiceData.invoiceDate).toLocaleDateString(
            "en-IN"
          )}`,
          { align: "right" }
        );

      doc.moveDown();
      doc.fontSize(12).text("Billed To");
      doc
        .fontSize(10)
        .text(`Name: ${customer?.name || "-"}`)
        .text(`Mobile: ${customer?.mobile || "-"}`)
        .text(`Email: ${customer?.email || "-"}`)
        .text(`City: ${customer?.city || "-"}`);

      doc.moveDown();
      doc.fontSize(12).text("Stay Details");
      doc
        .fontSize(10)
        .text(`Property: ${property?.name || "-"}`)
        .text(
          `Check-in: ${new Date(checkIn).toLocaleDateString("en-IN")} → Check-out: ${new Date(
            invoiceData.checkOut
          ).toLocaleDateString("en-IN")}`
        )
        .text(`Guests: ${invoiceData.adults} adults, ${invoiceData.children} children`);

      doc.moveDown();

      const tableTop = doc.y;
      doc.fontSize(11).fillColor("#162019");
      doc.text("Description", 40, tableTop);
      doc.text("Qty", 320, tableTop, { width: 50, align: "right" });
      doc.text("Rate", 380, tableTop, { width: 70, align: "right" });
      doc.text("Amount", 460, tableTop, { width: 90, align: "right" });

      doc
        .moveTo(40, tableTop + 16)
        .lineTo(550, tableTop + 16)
        .strokeColor("#D1D5DB")
        .stroke();

      let y = tableTop + 24;
      doc.fontSize(10).fillColor("#374151");
      for (const item of invoiceData.lineItems) {
        doc.text(item.description, 40, y, {
          width: 270,
          lineBreak: false
        });
        doc.text(String(item.quantity), 320, y, {
          width: 50,
          align: "right"
        });
        doc.text(formatINR(item.rate), 380, y, {
          width: 70,
          align: "right"
        });
        doc.text(formatINR(item.amount), 460, y, {
          width: 90,
          align: "right"
        });
        y += 18;
      }

      doc
        .moveTo(40, y)
        .lineTo(550, y)
        .strokeColor("#D1D5DB")
        .stroke();

      y += 10;
      const summary = [
        ["Room Charges", formatINR(invoiceData.roomCharges)],
        ["Food & Service Charges", formatINR(invoiceData.servicesTotal)],
        ["Discount", `- ${formatINR(invoiceData.discount)}`],
        ["GST Tax", formatINR(invoiceData.tax)],
        ["Other Charges", formatINR(invoiceData.otherCharges)]
      ];

      for (const [label, value] of summary) {
        doc.fontSize(10).fillColor("#374151").text(label, 380, y, {
          width: 100
        });
        doc.text(value, 460, y, { width: 90, align: "right" });
        y += 18;
      }

      doc
        .moveTo(40, y)
        .lineTo(550, y)
        .strokeColor("#162019")
        .stroke();

      y += 8;
      doc.fontSize(12).fillColor("#162019").text("Grand Total", 380, y, {
        width: 100
      });
      doc.text(formatINR(invoiceData.grandTotal), 460, y, {
        width: 90,
        align: "right"
      });

      y += 20;
      doc.fontSize(10).fillColor("#374151").text("Payments", 40, y);
      y += 16;
      for (const p of invoiceData.payments || []) {
        doc.text(
          `  ${p.paymentCode} · ${p.mode} · ${p.paymentType} · ${new Date(
            p.paymentDate
          ).toLocaleDateString("en-IN")}`,
          40,
          y
        );
        doc.text(formatINR(p.amount), 460, y, {
          width: 90,
          align: "right"
        });
        y += 16;
      }

      doc
        .fontSize(11)
        .fillColor("#162019")
        .text("Paid Amount", 380, y, { width: 100 })
        .text(formatINR(invoiceData.paidAmount), 460, y, {
          width: 90,
          align: "right"
        });
      y += 18;
      doc
        .fontSize(11)
        .fillColor("#162019")
        .text("Pending Balance", 380, y, { width: 100 })
        .text(formatINR(invoiceData.pendingAmount), 460, y, {
          width: 90,
          align: "right"
        });

      doc.moveDown(2);
      doc
        .fontSize(9)
        .fillColor("#6B7280")
        .text("Thank you for choosing Riverbells Resort.", {
          align: "center"
        });

      doc.end();
    };

    render();
  });
};

export { formatINR };
