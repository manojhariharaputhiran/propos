"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, ArrowLeft } from "lucide-react";

const PLANS = [
  {
    key: "growth",
    name: "Growth",
    monthly: 89,
    yearly: 71,
    description: "For growing teams winning more deals",
    features: [
      "Unlimited RFP responses",
      "Response library (knowledge base)",
      "Team review & approvals",
      "All export formats (Word, PDF, PPT, Sheets)",
      "Dedicated support",
    ],
    cta: "Start Growth plan",
    highlighted: true,
  },
  {
    key: "scale",
    name: "Scale",
    monthly: 249,
    yearly: 199,
    description: "For high-volume proposal teams",
    features: [
      "Everything in Growth",
      "CRM integration",
      "Custom AI agents",
      "Priority support & SLA",
      "Advanced analytics",
    ],
    cta: "Start Scale plan",
    highlighted: false,
  },
];

export default function UpgradePage() {
  const router = useRouter();
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
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
          <span className="text-sm font-semibold text-gray-900">Propos</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Heading */}
        <div className="text-center mb-12">
          <div className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
            You&apos;ve used your free RFP
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Keep winning proposals
          </h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Upgrade to continue submitting AI-powered proposals. Cancel anytime.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-1 bg-gray-100 rounded-lg p-1 mt-8">
            <button
              onClick={() => setInterval("monthly")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                interval === "monthly"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval("yearly")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                interval === "yearly"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Yearly
              <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                −20%
              </span>
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 max-w-xl mx-auto bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`bg-white rounded-2xl border p-8 flex flex-col ${
                plan.highlighted
                  ? "border-blue-500 shadow-lg shadow-blue-100 ring-1 ring-blue-500"
                  : "border-gray-200"
              }`}
            >
              {plan.highlighted && (
                <div className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full self-start mb-4">
                  Most popular
                </div>
              )}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    ${interval === "monthly" ? plan.monthly : plan.yearly}
                  </span>
                  <span className="text-gray-400 text-sm">/mo</span>
                </div>
                {interval === "yearly" && (
                  <p className="text-xs text-green-600 mt-1">
                    Billed annually (${(plan.yearly * 12).toLocaleString()}/yr)
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.key)}
                disabled={!!loading}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  plan.highlighted
                    ? "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    : "bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50"
                }`}
              >
                {loading === plan.key ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Redirecting to payment...
                  </>
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Trust signals */}
        <p className="text-center text-xs text-gray-400 mt-10">
          Secured by Stripe · Cancel anytime · No setup fees
        </p>
      </div>
    </div>
  );
}
