"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { rfpApi } from "@/lib/api";

export function RFPUpload() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (f) {
      setFile(f);
      setError(null);
      if (!title) {
        setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
      }
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const rfp = await rfpApi.upload(file, title || undefined);
      router.push(`/rfp/${rfp.id}`);
    } catch (err: unknown) {
      // Extract detailed error from axios response
      const axiosErr = err as { response?: { data?: unknown; status?: number }; message?: string };
      const detail = axiosErr?.response?.data
        ? JSON.stringify(axiosErr.response.data)
        : axiosErr?.message ?? "Upload failed. Please try again.";
      setError(`[${axiosErr?.response?.status ?? "?"}] ${detail}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-blue-400 hover:bg-gray-50",
          file ? "border-green-400 bg-green-50" : ""
        )}
      >
        <input {...getInputProps()} />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
              <FileText className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="text-gray-400 hover:text-red-500"
            >
              <X className="w-4 h-4 mr-1" /> Remove
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
              <Upload className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-700">
                {isDragActive ? "Drop your RFP here" : "Drag & drop your RFP"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or <span className="text-blue-600 font-medium">browse files</span>
              </p>
            </div>
            <p className="text-xs text-gray-400">Supports PDF, DOCX, TXT up to 50MB</p>
          </div>
        )}
      </div>

      {/* Title field */}
      <div className="space-y-2">
        <Label htmlFor="title">RFP Title</Label>
        <Input
          id="title"
          placeholder="e.g. Government Digital Services Platform RFP"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full h-12 text-base"
      >
        {uploading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Uploading & parsing...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 mr-2" />
            Upload & Start Analysis
          </>
        )}
      </Button>

      <p className="text-xs text-center text-gray-500">
        After upload, AI agents will parse your RFP and ask for a Go/No-Go decision before drafting begins.
      </p>
    </div>
  );
}
