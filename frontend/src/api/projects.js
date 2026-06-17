import axios from "axios";
import { API_URL } from "../constants/api";

const BASE = `${API_URL}/api/projects`;

export const getProjects = () => axios.get(`${BASE}/`);
export const getProjectById = (id) => axios.get(`${BASE}/${id}`);
export const getProjectsByCategory = (categoryId) =>
  axios.get(`${BASE}/category/${categoryId}`);
export const createProject = (data) => axios.post(`${BASE}/`, data);
export const deleteProject = (id) => axios.delete(`${BASE}/${id}`);
