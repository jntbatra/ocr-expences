"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle, XCircle } from "lucide-react";
import {
  getUploadUrl,
  uploadToS3,
  processReceipt,
  getExpenses,
} from "@/lib/api";
import Loader from "./Loader";

interface ExtractedData {
  merchant: string;
  date: string;
  total: number;
  category: string;
}

export default function UploadBox() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(
    null
  );
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      setError("");
      setExtractedData(null);
    } else {
      setError("Please select a valid image file");
    }
  };

  const pollForExpense = async (
    startTime: number
  ): Promise<ExtractedData | null> => {
    const maxAttempts = 20;
    const pollInterval = 3000; // 3 seconds

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      try {
        const expenses = await getExpenses();
        // Find the most recent expense created after upload
        const recentExpense = expenses.find((exp: any) => {
          const createdAt = new Date(exp.createdAt).getTime();
          return createdAt > startTime;
        });

        if (recentExpense) {
          return {
            merchant: recentExpense.merchant || "Unknown",
            date: recentExpense.date || "",
            total: recentExpense.total || 0,
            category: recentExpense.category || "General",
          };
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }
    return null;
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setError("");

      // Get signed URL
      const { uploadUrl, key } = await getUploadUrl(file.type);

      // Upload to S3
      await uploadToS3(uploadUrl, file);

      // Process the receipt
      await processReceipt(key);

      setUploading(false);
      setProcessing(true);

      // Poll for results
      const startTime = Date.now();
      const result = await pollForExpense(startTime);

      if (result) {
        setExtractedData(result);
      } else {
        setError("Processing took too long. Please check the expenses page.");
      }

      setProcessing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className="border-2 border-dashed border-indigo-300 rounded-xl p-12 text-center bg-gradient-to-br from-indigo-50 to-purple-50 hover:border-indigo-500 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileChange(e.dataTransfer.files[0]);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        />
        <Upload className="h-16 w-16 mx-auto text-indigo-600 mb-4" />
        <p className="text-xl font-semibold text-gray-700 mb-2">
          {file ? file.name : "Drop receipt image here or click to browse"}
        </p>
        <p className="text-sm text-gray-500">Supports: JPG, PNG</p>
      </div>

      {file && !uploading && !processing && !extractedData && (
        <button
          onClick={handleUpload}
          className="mt-6 w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md"
        >
          Upload & Process
        </button>
      )}

      {uploading && <Loader text="Uploading to S3..." />}
      {processing && <Loader text="Processing receipt with OCR..." />}

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <XCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {extractedData && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4 text-green-700">
            <CheckCircle className="h-6 w-6" />
            <h3 className="text-xl font-bold">Receipt Processed!</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Merchant</p>
              <p className="font-semibold text-gray-800">
                {extractedData.merchant}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-semibold text-gray-800">
                {extractedData.date}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Amount</p>
              <p className="font-semibold text-gray-800">
                ${extractedData.total.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Category</p>
              <p className="font-semibold text-gray-800">
                {extractedData.category}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
