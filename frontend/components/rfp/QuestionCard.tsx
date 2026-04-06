"use client";

import React, { useState } from "react";
import { MessageSquare, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/api";
import { rfpApi } from "@/lib/api";

interface QuestionCardProps {
  question: Question;
  index: number;
  rfpId: string;
  onSMESubmitted?: () => void;
}

export function QuestionCard({ question, index, rfpId, onSMESubmitted }: QuestionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showSMEInput, setShowSMEInput] = useState(false);
  const [smeAnswer, setSmeAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confidence = question.confidence;
  const confidencePct = confidence !== null ? Math.round(confidence * 100) : null;
  const answer = question.final_answer || question.draft_answer;

  const confidenceColor =
    confidence === null ? "text-gray-400" :
    confidence >= 0.8 ? "text-green-600" :
    confidence >= 0.6 ? "text-yellow-600" : "text-red-500";

  const confidenceBg =
    confidence === null ? "bg-gray-100" :
    confidence >= 0.8 ? "bg-green-100" :
    confidence >= 0.6 ? "bg-yellow-100" : "bg-red-100";

  const handleSMESubmit = async () => {
    if (!smeAnswer.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await rfpApi.submitSMEAnswer(rfpId, question.id, smeAnswer.trim());
      setSubmitted(true);
      setShowSMEInput(false);
      onSMESubmitted?.();
    } catch {
      setError("Failed to submit answer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cn(
      "bg-white rounded-xl border transition-all duration-200",
      question.needs_sme && !submitted ? "border-orange-200 shadow-orange-50 shadow-sm" : "border-gray-200",
    )}>
      {/* Header */}
      <div
        className="flex items-start gap-4 p-5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 leading-snug">{question.text}</p>

          {!expanded && answer && (
            <p className="text-xs text-gray-500 mt-1 truncate">{answer}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Confidence badge */}
          {confidencePct !== null && (
            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", confidenceBg, confidenceColor)}>
              {confidencePct}%
            </span>
          )}

          {/* SME needed indicator */}
          {question.needs_sme && !submitted && !question.sme_provided_answer && (
            <span className="text-xs bg-orange-100 text-orange-700 font-medium px-2 py-0.5 rounded-full">
              Needs your input
            </span>
          )}

          {/* Final answer indicator */}
          {question.final_answer && (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}

          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
          {/* Draft answer */}
          {answer ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {question.final_answer ? "Final Answer" : "Draft Answer"}
                </span>
                {confidencePct !== null && (
                  <span className={cn("text-xs font-medium", confidenceColor)}>
                    Confidence: {confidencePct}%
                  </span>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{answer}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating answer...
            </div>
          )}

          {/* SME input section */}
          {question.needs_sme && !submitted && !question.sme_provided_answer && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <p className="text-xs text-orange-700">
                  The AI wasn't confident answering this. Add your team's answer below and it will be incorporated into the final response.
                </p>
              </div>

              {showSMEInput ? (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Provide your expert answer here..."
                    value={smeAnswer}
                    onChange={(e) => setSmeAnswer(e.target.value)}
                    rows={4}
                    className="text-sm"
                  />
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSMESubmit}
                      disabled={!smeAnswer.trim() || submitting}
                    >
                      {submitting ? (
                        <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Submitting...</>
                      ) : (
                        <><Send className="w-3 h-3 mr-1" /> Submit Answer</>
                      )}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowSMEInput(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSMEInput(true)}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Add your answer
                </Button>
              )}
            </div>
          )}

          {/* SME answer submitted */}
          {(submitted || question.sme_provided_answer) && (
            <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-green-700">Your answer was added</p>
                {question.sme_provided_answer && (
                  <p className="text-xs text-green-600 mt-1">{question.sme_provided_answer}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
