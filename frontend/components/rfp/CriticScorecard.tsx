"use client";

import React from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { AlertTriangle, TrendingUp, CheckSquare, MessageSquare, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CriticReport } from "@/lib/api";

interface GaugeProps {
  value: number;
  label: string;
  icon: React.ReactNode;
}

function ScoreGauge({ value, label, icon }: GaugeProps) {
  const color =
    value >= 75 ? "#16a34a" :
    value >= 50 ? "#f59e0b" : "#dc2626";

  const bgColor =
    value >= 75 ? "bg-green-50 border-green-200" :
    value >= 50 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200";

  const data = [{ value, fill: color }];

  return (
    <div className={cn("rounded-xl border p-4 flex flex-col items-center gap-2", bgColor)}>
      <div className="w-24 h-24 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            data={data}
            startAngle={180}
            endAngle={-180}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: "#f3f4f6" }}
              dataKey="value"
              cornerRadius={8}
              angleAxisId={0}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-2xl font-bold"
            style={{ color }}
          >
            {value}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-center">
        <span className="text-gray-500">{icon}</span>
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </div>
    </div>
  );
}

interface CriticScorecardProps {
  report: CriticReport;
}

export function CriticScorecard({ report }: CriticScorecardProps) {
  const hasLowScore = [
    report.win_probability,
    report.completeness,
    report.persuasiveness,
    report.compliance,
  ].some((s) => s < 50);

  return (
    <div className="space-y-5">
      {/* Warning banner */}
      {hasLowScore && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">One or more scores are below 50%</p>
            <p className="text-xs text-yellow-700 mt-0.5">
              Address the critical flags below before submitting this proposal.
            </p>
          </div>
        </div>
      )}

      {/* Score gauges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreGauge
          value={report.win_probability}
          label="Win Probability"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <ScoreGauge
          value={report.completeness}
          label="Completeness"
          icon={<CheckSquare className="w-4 h-4" />}
        />
        <ScoreGauge
          value={report.persuasiveness}
          label="Persuasiveness"
          icon={<MessageSquare className="w-4 h-4" />}
        />
        <ScoreGauge
          value={report.compliance}
          label="Compliance"
          icon={<BarChart3 className="w-4 h-4" />}
        />
      </div>

      {/* Critical flags */}
      {report.critical_flags.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-red-700 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Critical Flags
          </h4>
          <div className="space-y-1.5">
            {report.critical_flags.map((flag, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2.5 bg-red-50 rounded-lg border border-red-200"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                <p className="text-sm text-red-700">{flag}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {report.suggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Suggested Improvements</h4>
          <div className="space-y-1.5">
            {report.suggestions.map((suggestion, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                <span className="text-blue-500 font-bold text-xs flex-shrink-0 mt-0.5">{i + 1}.</span>
                <p className="text-sm text-gray-700">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
