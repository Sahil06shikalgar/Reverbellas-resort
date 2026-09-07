import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import migrationRoutes from "./routes/migrationRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";

import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

import { seedDatabase } from "./seed/seedDatabase.js";

dotenv.config();

const app = express();

app.use(helmet());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://riverbells-resort-site.vercel.app",
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked: ${origin}`)
      );
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: "RATE_LIMITED",
    message: "Too many requests, please try again later."
  }
});

app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/migration", migrationRoutes);
app.use("/api/blogs", blogRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Riverbells Resort API is running",
  });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`Riverbells Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
