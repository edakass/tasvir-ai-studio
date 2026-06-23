import axios from "axios";
import { API_URL } from "../constants/api";

const BASE = `${API_URL}/api/content`;

export const generateContentPackage = (data) =>
  axios.post(`${BASE}/generate`, data, { timeout: 180000 });

export const getContentPackages = () => axios.get(`${BASE}/packages`);

export const deleteContentPackage = (packageId) =>
  axios.delete(`${BASE}/packages/${packageId}`);

export const updateContentPackageResult = (packageId, outputId, content) =>
  axios.put(`${BASE}/packages/${packageId}/results/${outputId}`, { content });
