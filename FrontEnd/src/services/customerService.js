import request from "./api";

export const getCustomers = async (params = {}) => {
  const query = new URLSearchParams();

  if (params.search) {
    query.append("search", params.search);
  }

  const queryString = query.toString();

  return request(
    `/customers${queryString ? `?${queryString}` : ""}`
  );
};

export const getCustomerById = async (id) => {
  return request(`/customers/${id}`);
};