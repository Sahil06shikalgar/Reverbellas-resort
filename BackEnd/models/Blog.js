import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    excerpt: {
      type: String,
      required: [true, "Blog excerpt is required"]
    },

    content: {
      type: String,
      required: [true, "Blog content is required"]
    },

    featuredImage: {
      type: String,
      default: ""
    },

    category: {
      type: String,
      default: "Riverbells"
    },

    tags: [
      {
        type: String,
        trim: true
      }
    ],

    author: {
      type: String,
      default: "Riverbells Resort"
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft"
    },

    seoTitle: {
      type: String,
      default: ""
    },

    seoDescription: {
      type: String,
      default: ""
    },

    publishedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

blogSchema.index({ status: 1 });
blogSchema.index({ category: 1 });

export default mongoose.model("Blog", blogSchema);