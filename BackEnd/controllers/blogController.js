import Blog from "../models/Blog.js";

const slugify = (text = "") =>
  String(text)
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const ensureUniqueSlug = async (base, currentId) => {
  let slug = slugify(base) || "blog";
  let candidate = slug;
  let count = 2;

  for (;;) {
    const query = { slug: candidate };
    if (currentId) query._id = { $ne: currentId };
    const existing = await Blog.findOne(query).select("_id");
    if (!existing) break;
    candidate = `${slug}-${count}`;
    count += 1;
  }

  return candidate;
};

const publicSelect =
  "title slug excerpt content featuredImage category tags author status publishedAt seoTitle seoDescription createdAt updatedAt";

const normalizeBody = (body) => {
  const {
    title,
    slug,
    excerpt,
    content,
    featuredImage = "",
    category = "Riverbells",
    tags = [],
    author = "Riverbells Resort",
    status = "draft",
    seoTitle = "",
    seoDescription = ""
  } = body;

  const cleanTags = Array.isArray(tags)
    ? tags.map((t) => String(t ?? "").trim()).filter(Boolean)
    : [];

  return {
    title: String(title ?? "").trim(),
    slug: String(slug ?? "").trim().toLowerCase(),
    excerpt: String(excerpt ?? "").trim(),
    content: String(content ?? "").trim(),
    featuredImage: String(featuredImage ?? "").trim(),
    category: String(category ?? "Riverbells").trim(),
    tags: cleanTags,
    author: String(author ?? "Riverbells Resort").trim(),
    status: status === "published" ? "published" : "draft",
    seoTitle: String(seoTitle ?? "").trim(),
    seoDescription: String(seoDescription ?? "").trim()
  };
};

// Protected — admin listing (all statuses), optional search + status filter
export const getAdminBlogs = async (req, res, next) => {
  try {
    const { search, status } = req.query;

    const query = {};

    if (status === "published" || status === "draft") {
      query.status = status;
    }

    if (search && String(search).trim()) {
      const term = String(search).trim();
      query.$or = [
        { title: { $regex: term, $options: "i" } },
        { slug: { $regex: term, $options: "i" } },
        { category: { $regex: term, $options: "i" } },
        { author: { $regex: term, $options: "i" } },
        { tags: { $regex: term, $options: "i" } }
      ];
    }

    const blogs = await Blog.find(query)
      .select(publicSelect)
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    next(error);
  }
};

// Protected — single blog for the editor
export const getBlogById = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id).select(publicSelect);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found"
      });
    }

    res.json({ success: true, data: blog });
  } catch (error) {
    next(error);
  }
};

// Public — ONLY published blogs
export const getPublishedBlogs = async (req, res, next) => {
  try {
    const blogs = await Blog.find({ status: "published" })
      .select(publicSelect)
      .sort({ publishedAt: -1, updatedAt: -1 });

    res.json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    next(error);
  }
};

// Public — single published blog by slug. Drafts are never exposed.
export const getBlogBySlug = async (req, res, next) => {
  try {
    const blog = await Blog.findOne({
      slug: String(req.params.slug || "").toLowerCase(),
      status: "published"
    }).select(publicSelect);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found"
      });
    }

    res.json({ success: true, data: blog });
  } catch (error) {
    next(error);
  }
};

// Protected
export const createBlog = async (req, res, next) => {
  try {
    const body = normalizeBody(req.body);
    const uniqueSlug = await ensureUniqueSlug(body.slug || body.title);

    const blog = await Blog.create({
      ...body,
      slug: uniqueSlug,
      publishedAt: body.status === "published" ? new Date() : null
    });

    res.status(201).json({ success: true, data: blog });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Blog slug already exists"
      });
    }
    next(error);
  }
};

// Protected
export const updateBlog = async (req, res, next) => {
  try {
    const existing = await Blog.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Blog not found"
      });
    }

    const body = normalizeBody(req.body);
    const uniqueSlug = await ensureUniqueSlug(
      body.slug || body.title,
      existing._id
    );

    const wasPublished = existing.status === "published";
    const willPublish = body.status === "published";

    const blog = await Blog.findByIdAndUpdate(
      existing._id,
      {
        ...body,
        slug: uniqueSlug,
        publishedAt:
          willPublish && (!wasPublished || !existing.publishedAt)
            ? new Date()
            : existing.publishedAt
      },
      { new: true, runValidators: true }
    ).select(publicSelect);

    res.json({ success: true, data: blog });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Blog slug already exists"
      });
    }
    next(error);
  }
};

// Protected
export const deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found"
      });
    }

    res.json({ success: true, message: "Blog deleted" });
  } catch (error) {
    next(error);
  }
};

// Protected — publish / unpublish
export const toggleBlogStatus = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found"
      });
    }

    const nextStatus =
      blog.status === "published" ? "draft" : "published";

    blog.status = nextStatus;
    if (nextStatus === "published" && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }
    await blog.save();

    res.json({ success: true, data: blog });
  } catch (error) {
    next(error);
  }
};