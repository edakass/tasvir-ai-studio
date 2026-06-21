import axios from "axios";
import { API_URL } from "../constants/api";

const BASE = `${API_URL}/api/generate`;

export const generatePrompt = (data) =>
  axios.post(`${BASE}/prompt`, data, { timeout: 60_000 });
export const generateImages = (data) =>
  axios.post(`${BASE}/images`, data, { timeout: 135_000 });
export const getProjectImages = (projectId) =>
  axios.get(`${BASE}/images/${projectId}`);
export const toggleFavorite = (imageId) =>
  axios.put(`${BASE}/images/${imageId}/favorite`);
export const toggleArchive = (imageId) =>
  axios.put(`${BASE}/images/${imageId}/archive`);
export const deleteImage = (imageId) =>
  axios.delete(`${BASE}/images/${imageId}`);
export const getImageDownloadUrl = (imageId, format) =>
  `${BASE}/images/${imageId}/download?format=${format}`;
