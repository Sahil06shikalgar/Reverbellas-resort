import {
  buildInvoiceData,
  buildInvoicePdfBuffer
} from "../services/invoiceService.js";

export const getInvoice = async (req, res, next) => {
  try {
    const data = await buildInvoiceData(req.params.bookingId);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoicePdf = async (req, res, next) => {
  try {
    const data = await buildInvoiceData(req.params.bookingId);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    const buffer = await buildInvoicePdfBuffer(data);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${data.invoiceNumber}.pdf"`
    );
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};
