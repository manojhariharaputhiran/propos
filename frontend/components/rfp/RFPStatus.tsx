"use client";

import React from "react";
import { CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RFPStatus } from "@/lib/api";

// Three user-facing stages — internal states map to these
const STEPS = [
  {
    label: "Reading document",
    description: "Extracting questions",
    active: ["uploaded", "parsing", "drafting"] as RFPStatus[],
    done: ["sme_needed", "critic_done", "human_review", "export_ready", "completed"] as RFPStatus[],
  },
  {
    label: "Writing responses",
    description: "AI drafting answers",
    active: ["sme_needed"] as RFPStatus[],
    done: ["critic_done", "human_review", "export_ready", "completed"] as RFPStatus[],
  },
  {
    label: "Ready to review",
    description: "Your proposal is ready",
    active: ["critic_done", "human_review", "export_ready", "completed"] as RFPStatus[],
    done: [] as RFPStatus[],
  },
];

type StepState = "done" | "active" | "pending";

function getState(step: typeof STEPS[0], status: RFPStatus): StepState {
  if (step.done.includes(status)) return "done";
  if (step.active.includes(status)) return "active";
  return "pending";
}

export function RFPStatusStepper({ status }: { status: RFPStatus }) {
  if (status === "rejected") {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <span className="text-sm font-medium text-red-700">No bid — this RFP was archived</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <span className="text-sm font-medium text-red-700">Something went wrong — please try again or contact support</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0 w-full">
      {STEPS.map((step, i) => {
        const state = getState(step, status);
        const isLast = i === STEPS.length - 1;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all",
                state === "done" && "bg-green-500 border-green-500",
                state === "active" && "bg-blue-600 border-blue-600",
                state === "pending" && "bg-white border-gray-200",
              )}>
                {state === "done" && <CheckCircle2 className="w-4 h-4 text-white" />}
                {state === "active" && <Loader2 className="w-4 h-4 text-white animate-spin" />}
                {state === "pending" && <Circle className="w-4 h-4 text-gray-300" />}
              </div>
              <div className="text-center w-28">
                <p className={cn(
                  "text-xs font-semibold",
                  state === "active" && "text-blue-700",
                  state === "done" && "text-green-700",
                  state === "pending" && "text-gray-400",
                )}>{step.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{step.description}</p>
              </div>
            </div>
            {!isLast && (
              <div className={cn(
                "flex-1 h-0.5 mb-7",
                state === "done" ? "bg-green-300" : "bg-gray-200"
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function RFPStatusBadge({ status }: { status: RFPStatus }) {
  const config: Record<RFPStatus, { label: string; className: string }> = {
    uploaded:             { label: "Reading",          className: "bg-gray-100 text-gray-600" },
    parsing:              { label: "Reading",          className: "bg-gray-100 text-gray-600" },
    qualification_needed: { label: "Writing",          className: "bg-blue-100 text-blue-700" },
    qualified:            { label: "Writing",          className: "bg-blue-100 text-blue-700" },
    drafting:             { label: "Writing",          className: "bg-blue-100 text-blue-700" },
    sme_needed:           { label: "Needs your input", className: "bg-orange-100 text-orange-700" },
    critic_done:          { label: "Reviewing",        className: "bg-purple-100 text-purple-700" },
    human_review:         { label: "Ready to review",  className: "bg-amber-100 text-amber-700" },
    export_ready:         { label: "Ready to export",  className: "bg-green-100 text-green-700" },
    completed:            { label: "Completed",        className: "bg-emerald-100 text-emerald-700" },
    rejected:             { label: "No bid",           className: "bg-gray-100 text-gray-500" },
    error:                { label: "Error",            className: "bg-red-100 text-red-700" },
  };

  const c = config[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", c.className)}>
      {c.label}
    </span>
  );
}
