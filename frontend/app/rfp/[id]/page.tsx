"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, AlertCircle, FileText, Loader2 } from "lucide-react";
import type { RFPStatus } from "@/lib/api";
import { QuestionCard } from "@/components/rfp/QuestionCard";
import { CriticScorecard } from "@/components/rfp/CriticScorecard";
import { ExportButton } from "@/components/rfp/ExportButton";
import { rfpApi, type RFP } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const STEPS = [
  { label: "Writing",       statuses: ["uploaded","parsing","drafting","qualification_needed","qualified"] as RFPStatus[] },
  { label: "Your input",    statuses: ["sme_needed"] as RFPStatus[] },
  { label: "Ready",         statuses: ["critic_done","human_review","export_ready","completed"] as RFPStatus[] },
];

function StepIndicator({ status }: { status: RFPStatus }) {
  if (status === "error" || status === "rejected") return null;

  const activeIndex = STEPS.findIndex(s => s.statuses.includes(status));
  if (activeIndex === -1) return null;

  return (
    <div className="flex items-center gap-2 mt-2">
      {STEPS.map((step, i) => {
        const done    = i < activeIndex;
        const active  = i === activeIndex;
        return (
          <React.Fragment key={i}>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full transition-colors ${
                done   ? "bg-green-500" :
                active ? "bg-blue-600" :
                         "bg-gray-200"
              }`} />
              <span className={`text-xs font-medium ${
                done   ? "text-green-600" :
                active ? "text-blue-700" :
                         "text-gray-400"
              }`}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-shrink-0 w-6 h-px ${done ? "bg-green-300" : "bg-gray-200"}`} />
            )}
          </React.Fragment>
        );
      })}
      <span className="text-xs text-gray-400 ml-1">{activeIndex + 1}/{STEPS.length}</span>
    </div>
  );
}

const POLL_INTERVAL_MS = 4000;
const POLLING_STATUSES = new Set([
  "uploaded", "parsing", "drafting", "qualified", "critic_done",
]);

const PROCESSING_MESSAGES: Partial<Record<string, string>> = {
  uploaded:  "Reading your document...",
  parsing:   "Reading your document...",
  drafting:  "Writing your proposal responses — this takes a minute...",
  qualified: "Writing your proposal responses...",
  critic_done: "Almost there...",
};

export default function RFPDetailPage() {
  const params = useParams();
  const rfpId = params.id as string;

  const [rfp, setRfp] = useState<RFP | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRFP = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await rfpApi.getStatus(rfpId);
      setRfp(data);
      setError(null);
    } catch {
      setError("Failed to load. Check that the backend is running.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [rfpId]);

  useEffect(() => { fetchRFP(); }, [fetchRFP]);

  useEffect(() => {
    if (!rfp || !POLLING_STATUSES.has(rfp.status)) return;
    const interval = setInterval(() => fetchRFP(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [rfp, fetchRFP]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !rfp) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-700 font-medium mb-2">Could not load proposal</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button onClick={() => fetchRFP()} className="text-sm text-blue-600 hover:underline">Try again</button>
        </div>
      </div>
    );
  }

  if (!rfp) return null;

  const isProcessing = POLLING_STATUSES.has(rfp.status);
  const needsInput = rfp.status === "sme_needed";
  const isReady = ["human_review", "export_ready", "completed"].includes(rfp.status);
  const canExport = ["human_review", "export_ready", "completed"].includes(rfp.status);
  const pendingInputCount = rfp.questions.filter(q => q.needs_sme && !q.sme_provided_answer).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {rfp.title || rfp.file_name || "Untitled RFP"}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Uploaded {formatDate(rfp.created_at)}
                  {rfp.questions.length > 0 && ` · ${rfp.questions.length} questions`}
                </p>
                <StepIndicator status={rfp.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Processing state */}
        {isProcessing && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-center gap-4">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                {PROCESSING_MESSAGES[rfp.status] ?? "Processing..."}
              </p>
              <p className="text-xs text-blue-600 mt-0.5">This page updates automatically</p>
            </div>
          </div>
        )}

        {/* Needs input banner */}
        {needsInput && pendingInputCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-amber-900 mb-1">
              {pendingInputCount} question{pendingInputCount > 1 ? "s" : ""} need your input
            </p>
            <p className="text-xs text-amber-700">
              The AI flagged these because they need specific knowledge from your team.
              Scroll down, expand each flagged question, and add your answer.
              Once all are filled in, drafting will resume automatically.
            </p>
          </div>
        )}

        {/* Ready banner */}
        {isReady && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-green-900">Your proposal is ready</p>
              <p className="text-xs text-green-700 mt-0.5">
                Review the responses below, then export in your preferred format.
              </p>
            </div>
            <ExportButton rfpId={rfp.id} rfpTitle={rfp.title} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Questions */}
        {rfp.questions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
              Responses ({rfp.questions.length})
            </h2>
            {rfp.questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={i}
                rfpId={rfp.id}
                onSMESubmitted={() => fetchRFP()}
              />
            ))}
          </div>
        )}

        {/* Critic scorecard — at the bottom, after questions */}
        {rfp.critic_report && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Proposal scorecard</h2>
            <CriticScorecard report={rfp.critic_report} />
          </div>
        )}

      </div>
    </div>
  );
}
