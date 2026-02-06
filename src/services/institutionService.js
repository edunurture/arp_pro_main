import axios from "axios";

/**
 * Configure your backend base URL here.
 * Example: http://localhost:5000/api
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const http = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

export const institutionApi = {
  list: async () => (await http.get("/institutions")).data,
  get: async (id) => (await http.get(`/institutions/${id}`)).data,
  create: async (payload) => (await http.post("/institutions", payload)).data,
  update: async (id, payload) => (await http.put(`/institutions/${id}`, payload)).data,
  remove: async (id) => (await http.delete(`/institutions/${id}`)).data,
};
