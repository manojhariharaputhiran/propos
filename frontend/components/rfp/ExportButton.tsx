"use client";

import React, { useState } from "react";
import { Download, FileText, Presentation, TableIcon, Loader2, ChevronDown } from "lucide-react";
import { rfpApi, downloadBlob } from "@/lib/api";

interface ExportButtonProps {
  rfpId: string;
  rfpTitle?: string | null;
  disabled?: boolean;
}

const FORMATS = [
  { value: "word"   as const, label: "Word",        sub: ".docx",  icon: FileText },
  { value: "pdf"    as const, label: "PDF",          sub: ".pdf",   icon: FileText },
  { value: "ppt"    as const, label: "PowerPoint",   sub: ".pptx",  icon: Presentation },
  { value: "sheets" as const, label: "Excel",        sub: ".xlsx",  icon: TableIcon },
];

export function ExportButton({ rfpId, rfpTitle, disabled }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (format: typeof FORMATS[number]["value"]) => {
    setLoading(format);
    setError(null);
    setOpen(false);
    try {
      const blob = await rfpApi.export(rfpId, format);
      const fmt = FORMATS.find(f => f.value === format)!;
      const filename = `${(rfpTitle || "Proposal").replace(/\s+/g, "_")}${fmt.sub}`;
      downloadBlob(blob, filename);
    } catch {
      setError("Export failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={disabled || !!loading}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        Download proposal
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 w-52">
            <p className="text-xs text-gray-400 px-4 pb-2 font-medium uppercase tracking-wide">Choose format</p>
            {FORMATS.map(({ value, label, sub, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleExport(value)}
                disabled={!!loading}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {loading === value
                  ? <Loader2 className="w-4 h-4 animate-spin text-blue-600 flex-shrink-0" />
                  : <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                }
                <span className="font-medium">{label}</span>
                <span className="text-gray-400 text-xs ml-auto">{sub}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}
