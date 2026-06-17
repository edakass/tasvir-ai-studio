import axios from "axios";
import { API_URL } from "../constants/api";

const BASE = `${API_URL}/api/content`;

export const generateContentPackage = (data) =>
  axios.post(`${BASE}/generate`, data, { timeout: 180000 });
