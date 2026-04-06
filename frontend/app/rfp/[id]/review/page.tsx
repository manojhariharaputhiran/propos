"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CriticScorecard } from "@/components/rfp/CriticScorecard";
import { ExportButton } from "@/components/rfp/ExportButton";
import { rfpApi, type RFP } from "@/lib/api";

export default function ReviewPage() {
  const params = useParams();
  const rfpId = params.id as string;

  const [rfp, setRfp] = useState<RFP | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    rfpApi.getDraft(rfpId).then(setRfp).finally(() => setLoading(false));
  }, [rfpId]);

  const handleApprove = async (approved: boolean) => {
    setApproving(true);
    try {
      await rfpApi.approve(rfpId, approved);
      const updated = await rfpApi.getStatus(rfpId);
      setRfp(updated);
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!rfp) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <Link
            href={`/rfp/${rfpId}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to RFP
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Final Review</h1>
          <p className="text-gray-500 text-sm mt-1">{rfp.title}</p>
        </div>

        {/* Scorecard */}
        {rfp.critic_report && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Proposal Scorecard</h2>
            <CriticScorecard report={rfp.critic_report} />
          </div>
        )}

        {/* Full Q&A */}
        <div className="bg-white rounded-xl border p-6 space-y-6">
          <h2 className="font-semibold text-gray-900">Complete Responses</h2>
          {rfp.questions.map((q, i) => (
            <div key={q.id} className="space-y-2 pb-6 border-b border-gray-100 last:border-0">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                  {i + 1}
                </span>
                <p className="font-medium text-gray-900 text-sm">{q.text}</p>
              </div>
              <div className="ml-9">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {q.final_answer || q.draft_answer || "No response generated."}
                  </p>
                </div>
                {q.confidence !== null && (
                  <p className="text-xs text-gray-400 mt-1">
                    Confidence: {Math.round(q.confidence * 100)}%
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Approve/Reject */}
        {rfp.status === "human_review" && (
          <div className="bg-white rounded-xl border border-amber-200 p-6 flex items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              Ready to approve this proposal for export?
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => handleApprove(true)}
                disabled={approving}
              >
                {approving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => handleApprove(false)}
                disabled={approving}
                className="text-orange-600 border-orange-300"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Revise
              </Button>
            </div>
          </div>
        )}

        {rfp.status === "export_ready" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center justify-between">
            <p className="font-semibold text-green-800">Approved! Ready to export.</p>
            <ExportButton rfpId={rfp.id} rfpTitle={rfp.title} />
          </div>
        )}
      </div>
    </div>
  );
}
