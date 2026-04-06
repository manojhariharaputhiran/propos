"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { ArrowLeft, Layers, Upload, FileX, CheckCircle2, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { orgApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  path: string;
  is_default: boolean;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await orgApi.listTemplates();
      setTemplates(data.templates);
    } catch {
      setError("Failed to load templates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await orgApi.uploadTemplate(file);
      setSuccess(`Template "${res.filename}" uploaded successfully!`);
      await fetchTemplates();
    } catch {
      setError("Failed to upload template. Ensure it is a valid .pptx file.");
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    },
    maxFiles: 1,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">PPT Templates</h1>
              <p className="text-sm text-gray-500">
                Upload branded templates for proposal presentations
              </p>
            </div>
          </div>
        </div>

        {/* Template placeholders guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-blue-800">Template Placeholders</p>
          <p className="text-xs text-blue-700">
            Add these text placeholders in your PowerPoint slides and they will be automatically populated:
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { placeholder: "{{title}}", desc: "RFP title" },
              { placeholder: "{{body_text}}", desc: "Full Q&A content" },
              { placeholder: "{{chart}}", desc: "Score chart (auto-generated)" },
            ].map(({ placeholder, desc }) => (
              <div key={placeholder} className="bg-white rounded-lg p-2.5 border border-blue-200">
                <code className="text-xs font-mono text-blue-700 font-bold">{placeholder}</code>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upload zone */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Upload New Template</h2>

          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
              isDragActive ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
            )}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-sm text-gray-600">Uploading template...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-300" />
                <p className="text-sm font-medium text-gray-600">
                  {isDragActive ? "Drop your .pptx template here" : "Drag & drop a .pptx file"}
                </p>
                <p className="text-xs text-gray-400">or click to browse</p>
              </div>
            )}
          </div>

          {success && (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              {success}
            </div>
          )}

          {error && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Template list */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Your Templates</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600" />
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <FileX className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium">No templates yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Upload a .pptx template above. The AI will use the built-in default until then.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {templates.map((tpl) => (
                <div key={tpl.id} className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Layers className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm truncate">{tpl.name}</p>
                      {tpl.is_default && (
                        <span className="flex items-center gap-0.5 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                          <Star className="w-3 h-3" /> Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{tpl.path}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
