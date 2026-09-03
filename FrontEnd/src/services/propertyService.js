import request from "./api";

export const getProperties = async () => {
  return request("/properties");
};

export const createProperty = async (propertyData) => {
  return request("/properties", {
    method: "POST",
    body: JSON.stringify(propertyData),
  });
};

export const updateProperty = async (id, propertyData) => {
  return request(`/properties/${id}`, {
    method: "PUT",
    body: JSON.stringify(propertyData),
  });
};