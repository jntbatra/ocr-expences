import { API_BASE_URL } from "./config";

export const getUploadUrl = async (contentType: string = "image/jpeg") => {
  const response = await fetch(`${API_BASE_URL}/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType }),
  });
  if (!response.ok) throw new Error("Failed to get upload URL");
  return response.json();
};

export const uploadToS3 = async (url: string, file: File) => {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!response.ok) throw new Error("Failed to upload to S3");
};

export const processReceipt = async (key: string) => {
  const response = await fetch(`${API_BASE_URL}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });
  if (!response.ok) throw new Error("Failed to process receipt");
  return response.json();
};

export const getExpenses = async () => {
  const response = await fetch(`${API_BASE_URL}/expenses`);
  if (!response.ok) throw new Error("Failed to fetch expenses");
  const data = await response.json();
  return data.expenses || [];
};

export const getMonthlySummary = async (month: string) => {
  const response = await fetch(`${API_BASE_URL}/summary?month=${month}`);
  if (!response.ok) throw new Error("Failed to fetch summary");
  return response.json();
};
