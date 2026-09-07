import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js";

const signToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role = "STAFF" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: "Name, email and password are required"
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });

    if (existing) {
      return res.status(409).json({
        success: false,
        code: "DUPLICATE",
        message: "A user with this email already exists"
      });
    }

    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: user.toPublic(),
        token: signToken(user)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password"
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        code: "ACCOUNT_DISABLED",
        message: "Account has been deactivated"
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: user.toPublic(),
        token: signToken(user)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    res.json({
      success: true,
      data: {
        user: user.toPublic()
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully"
  });
};
