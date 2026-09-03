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

export const getAvailability = async (params) => {
  const query = new URLSearchParams();

  if (params.checkIn) query.append("checkIn", params.checkIn);
  if (params.checkOut) query.append("checkOut", params.checkOut);
  if (typeof params.adults !== "undefined") query.append("adults", params.adults);
  if (typeof params.children !== "undefined") query.append("children", params.children);

  const queryString = query.toString();

  return request(`/properties/availability${queryString ? `?${queryString}` : ""}`);
};