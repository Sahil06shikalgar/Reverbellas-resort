// backend/seed/seedDatabase.js
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import { seedIfEmpty } from "./seedProperties.js";

export const seedAdmin = async () => {
  const existing = await User.countDocuments();
  if (existing > 0) return { seeded: false, reason: "Users already exist" };

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@riverbells.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  await User.create({
    name: "Riverbells Admin",
    email: adminEmail,
    password: adminPassword,
    role: "ADMIN"
  });

  return { seeded: true, reason: "Admin user created" };
};

export const seedDatabase = async () => {
  const propertyResult = await seedIfEmpty();
  const adminResult = await seedAdmin();
  return { properties: propertyResult, admin: adminResult };
};