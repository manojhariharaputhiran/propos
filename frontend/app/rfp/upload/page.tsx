"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, Check, Loader2 } from "lucide-react";
import { RFPUpload } from "@/components/rfp/RFPUpload";
import { rfpApi } from "@/lib/api";

const PLANS = [
  {
    key: "growth",
    name: "Growth",
    monthly: 49,
    yearly: 39,
    limit: "10 RFPs/month",
    features: ["10 RFPs per month", "Response library", "Team review & approvals", "All export formats", "Dedicated support"],
    highlighted: true,
    cta: "Start Growth — $49/mo",
  },
  {
    key: "scale",
    name: "Scale",
    monthly: 149,
    yearly: 119,
    limit: "Unlimited",
    features: ["Unlimited RFPs", "Custom AI agents", "SSO & permissions", "CRM integration", "SLA & priority support"],
    highlighted: false,
    cta: "Start Scale — $149/mo",
  },
];

function UpgradeGate() {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (planKey: string) => {
    setLoading(planKey);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey, interval }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-10 shadow-sm text-center">
      <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
        You&apos;ve used your 3 free RFPs
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to keep going?</h2>
      <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
        You&apos;ve completed your free proposals. Pick a plan to keep submitting and unlock the full platform.
      </p>

      {/* Billing toggle */}
      <div className="inline-flex items-center gap-1 bg-gray-100 rounded-lg p-1 mb-8">
        <button
          onClick={() => setInterval("monthly")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${interval === "monthly" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
        >
          Monthly
        </button>
        <button
          onClick={() => setInterval("yearly")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${interval === "yearly" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
        >
          Yearly
          <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">−20%</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
        {PLANS.map((plan) => {
          const price = interval === "monthly" ? plan.monthly : plan.yearly;
          return (
            <div
              key={plan.key}
              className={`rounded-xl border p-6 flex flex-col ${plan.highlighted ? "border-blue-500 ring-1 ring-blue-500 shadow-sm" : "border-gray-200"}`}
            >
              {plan.highlighted && (
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full self-start mb-3">Most popular</span>
              )}
              <div className="mb-4">
                <p className="font-bold text-gray-900 text-lg">{plan.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{plan.limit}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">${price}</span>
                  <span className="text-sm text-gray-400">/mo</span>
                </div>
                {interval === "yearly" && (
                  <p className="text-xs text-green-600 mt-1">Billed ${price * 12}/yr</p>
                )}
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.key)}
                disabled={!!loading}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  plan.highlighted
                    ? "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    : "bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50"
                }`}
              >
                {loading === plan.key ? <><Loader2 className="w-4 h-4 animate-spin" />Redirecting...</> : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-6">Secured by Stripe · Cancel anytime</p>
    </div>
  );
}

export default function UploadPage() {
  const [rfpCount, setRfpCount] = useState<number | null>(null);

  useEffect(() => {
    rfpApi.getDashboardStats().then((s) => setRfpCount(s.total)).catch(() => setRfpCount(0));
  }, []);

  const overLimit = rfpCount !== null && rfpCount >= 3;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Upload RFP</h1>
              <p className="text-sm text-gray-500">
                {overLimit
                  ? "Upgrade to continue submitting proposals"
                  : "Upload your RFP document and our AI agents will handle the rest"}
              </p>
            </div>
          </div>
        </div>

        {rfpCount === null ? (
          /* Loading */
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : overLimit ? (
          <UpgradeGate />
        ) : (
          <>
            {/* Process steps */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              {[
                { step: "1", label: "Upload", desc: "PDF or DOCX", active: true },
                { step: "2", label: "Parse", desc: "AI extracts Qs", active: false },
                { step: "3", label: "Go/No-Go", desc: "Your decision", active: false },
                { step: "4", label: "Draft", desc: "AI writes responses", active: false },
              ].map(({ step, label, desc, active }) => (
                <div
                  key={step}
                  className={`rounded-xl p-3 text-center ${active ? "bg-blue-600 text-white" : "bg-white border border-gray-200"}`}
                >
                  <div className={`text-xs font-bold mb-0.5 ${active ? "text-blue-200" : "text-gray-400"}`}>Step {step}</div>
                  <div className={`text-sm font-semibold ${active ? "text-white" : "text-gray-700"}`}>{label}</div>
                  <div className={`text-xs mt-0.5 ${active ? "text-blue-200" : "text-gray-400"}`}>{desc}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <RFPUpload />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
