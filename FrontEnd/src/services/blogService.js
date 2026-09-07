import request from "./api";

export const getPublishedBlogs = async () => {
  return request("/blogs");
};

export const getBlogBySlug = async (slug) => {
  return request(`/blogs/${encodeURIComponent(slug)}`);
};

export const getAdminBlogs = async (params = {}) => {
  const query = new URLSearchParams();

  if (params.search) {
    query.append("search", params.search);
  }

  if (params.status) {
    query.append("status", params.status);
  }

  const queryString = query.toString();

  return request(`/blogs/admin${queryString ? `?${queryString}` : ""}`);
};

export const getBlogById = async (id) => {
  return request(`/blogs/admin/${id}`);
};

export const createBlog = async (data) => {
  return request("/blogs", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateBlog = async (id, data) => {
  return request(`/blogs/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteBlog = async (id) => {
  return request(`/blogs/${id}`, {
    method: "DELETE",
  });
};

export const toggleBlogStatus = async (id) => {
  return request(`/blogs/${id}/status`, {
    method: "PATCH",
  });
};