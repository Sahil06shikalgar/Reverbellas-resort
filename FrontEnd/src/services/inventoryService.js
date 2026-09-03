import request from "./api";

export const getInventory = async (params = {}) => {
  const query = new URLSearchParams();

  if (params.search) {
    query.append("search", params.search);
  }

  if (params.lowStock) {
    query.append("lowStock", "true");
  }

  const queryString = query.toString();

  return request(
    `/inventory${queryString ? `?${queryString}` : ""}`
  );
};

export const createInventory = async (data) => {
  return request("/inventory", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateInventory = async (id, data) => {
  return request(`/inventory/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const stockIn = async (id, data) => {
  return request(`/inventory/${id}/stock-in`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const stockOut = async (id, data) => {
  return request(`/inventory/${id}/stock-out`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};