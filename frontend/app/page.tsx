"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, ChevronDown } from "lucide-react";

// ── FAQ data ──────────────────────────────────────────────────────────────────
const faqs = [
  {
    q: "What counts as one RFP?",
    a: "Each unique document you upload counts as one RFP. You can revise, export in multiple formats, and collaborate with your team — all within the same RFP without using additional credits.",
  },
  {
    q: "Do I need to set up anything before uploading?",
    a: "No. Upload a PDF or Word doc and we'll handle the rest. You can optionally add your past responses or brand guidelines to improve output quality, but it's not required to get started.",
  },
  {
    q: "How accurate are the draft responses?",
    a: "Accuracy depends on how well the RFP is structured and how much context you've provided. In testing, teams report needing 60–80% less editing compared to writing from scratch. You always review before exporting.",
  },
  {
    q: "Can my whole team collaborate on one response?",
    a: "Yes. On Growth and Scale plans, multiple team members can review, edit, and submit SME answers from the same workspace. Changes are tracked and you can approve before anything ships.",
  },
  {
    q: "What export formats are supported?",
    a: "Word (.docx), PDF, PowerPoint (.pptx), and Excel. All formats are generated from the same approved content — no reformatting required.",
  },
];

// ── Pricing data ──────────────────────────────────────────────────────────────
const plans = {
  monthly: [
    {
      name: "Free",
      price: "$0",
      per: "",
      note: "first 3 RFPs, always",
      cta: "Get started",
      href: "/login",
      featured: false,
      features: ["3 complete RFP responses", "All export formats", "Compliance checking", "Human review workflow"],
    },
    {
      name: "Growth",
      price: "$49",
      per: "/month",
      note: "up to 10 RFPs per month",
      cta: "Start free, upgrade later",
      href: "/login",
      featured: true,
      features: ["10 RFPs per month", "Response library (knowledge base)", "Team review & approvals", "Custom response templates", "Dedicated support", "All export formats"],
    },
    {
      name: "Scale",
      price: "$149",
      per: "/month",
      note: "unlimited RFPs",
      cta: "Talk to us",
      href: "/login",
      featured: false,
      features: ["Unlimited RFPs", "Dedicated knowledge base", "SSO & advanced permissions", "Custom agent training", "SLA & dedicated support", "CRM integration"],
    },
  ],
  yearly: [
    {
      name: "Free",
      price: "$0",
      per: "",
      note: "first 3 RFPs, always",
      cta: "Get started",
      href: "/login",
      featured: false,
      features: ["3 complete RFP responses", "All export formats", "Compliance checking", "Human review workflow"],
    },
    {
      name: "Growth",
      price: "$39",
      per: "/month",
      note: "billed annually — save $120/yr",
      cta: "Start free, upgrade later",
      href: "/login",
      featured: true,
      features: ["10 RFPs per month", "Response library (knowledge base)", "Team review & approvals", "Custom response templates", "Dedicated support", "All export formats"],
    },
    {
      name: "Scale",
      price: "$119",
      per: "/month",
      note: "billed annually — save $360/yr",
      cta: "Talk to us",
      href: "/login",
      featured: false,
      features: ["Unlimited RFPs", "Dedicated knowledge base", "SSO & advanced permissions", "Custom agent training", "SLA & dedicated support", "CRM integration"],
    },
  ],
};

export default function LandingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="7" fill="#2563eb"/>
              <rect x="7" y="8" width="6" height="5" rx="1.5" fill="white"/>
              <rect x="15" y="8" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.5"/>
              <rect x="7" y="15" width="14" height="2" rx="1" fill="white" fillOpacity="0.4"/>
              <rect x="7" y="19" width="10" height="2" rx="1" fill="white" fillOpacity="0.25"/>
            </svg>
            <span className="font-bold text-gray-900 tracking-tight text-[15px]">Propos</span>
          </div>

          {/* Links */}
          <div className="hidden sm:flex items-center gap-8">
            {[["Features", "#features"], ["How it works", "#how-it-works"], ["Pricing", "#pricing"], ["FAQ", "#faq"]].map(([label, href]) => (
              <a key={label} href={href} className="relative text-sm text-gray-500 hover:text-gray-900 transition-colors group">
                {label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full rounded-full" />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">Sign in</Link>
            <Link href="/login" className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Try for free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="pt-20 pb-0 px-6 text-center overflow-hidden">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 mb-8">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
            <span className="text-xs text-blue-700 font-medium">First 3 RFPs free — no credit card needed</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-6">
            Stop losing weekends
            <br />to proposals.
          </h1>

          <p className="text-xl text-gray-500 leading-relaxed mb-10 max-w-xl mx-auto">
            Upload any RFP. Get a structured draft back in minutes — not days.
            Your team reviews, refines, and submits. That&apos;s it.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Link
              href="/login"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              Start your first RFP free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-gray-600 px-6 py-3.5 rounded-xl text-sm font-medium hover:text-gray-900 border border-gray-200 hover:border-gray-300 transition-all"
            >
              See how it works
            </a>
          </div>

          <p className="text-sm text-gray-400 mb-16">
            No credit card needed. First 3 RFPs are on us.{" "}
            <a href="#pricing" className="text-gray-500 underline underline-offset-2 hover:text-gray-700 transition-colors">
              From $49/mo after.
            </a>
          </p>
        </div>

        {/* Product mockup */}
        <div className="max-w-5xl mx-auto relative">
          {/* Glow under card */}
          <div className="absolute inset-x-20 -top-4 h-12 bg-blue-100 blur-2xl rounded-full opacity-60" />
          <div className="relative rounded-t-2xl border border-gray-200 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden bg-white">
            {/* Browser chrome */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white rounded-md h-6 max-w-sm mx-auto border border-gray-200 flex items-center px-3">
                <span className="text-xs text-gray-400">app.propos.io/dashboard</span>
              </div>
            </div>

            {/* App shell */}
            <div className="flex h-[420px]">
              {/* Sidebar */}
              <div className="w-52 border-r border-gray-100 bg-gray-50 flex-shrink-0 p-4 flex flex-col gap-1">
                <div className="flex items-center gap-2 px-3 py-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-blue-600" />
                  <div className="text-xs font-bold text-gray-900">Propos</div>
                </div>
                {[
                  { label: "Dashboard", active: true },
                  { label: "Upload RFP", active: false },
                  { label: "Templates", active: false },
                  { label: "Agents", active: false },
                ].map(({ label, active }) => (
                  <div key={label} className={`px-3 py-2 rounded-lg text-xs font-medium ${active ? "bg-blue-50 text-blue-700" : "text-gray-500"}`}>
                    {label}
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-sm font-bold text-gray-900 mb-0.5">RFP Responses</div>
                    <div className="text-xs text-gray-400">3 active this month</div>
                  </div>
                  <div className="h-7 w-24 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">+ New RFP</span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: "In Progress", val: "2", color: "text-blue-600 bg-blue-50" },
                    { label: "Needs Review", val: "1", color: "text-amber-600 bg-amber-50" },
                    { label: "Completed", val: "7", color: "text-green-600 bg-green-50" },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                      <div className={`text-lg font-bold ${color.split(" ")[0]}`}>{val}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>

                {/* RFP list */}
                <div className="space-y-2">
                  {[
                    { name: "City of Portland — IT Infrastructure RFP", status: "Drafting", badge: "bg-indigo-50 text-indigo-600", bar: 65 },
                    { name: "Healthcare Alliance Q2 Vendor Evaluation", status: "Export Ready", badge: "bg-green-50 text-green-600", bar: 100 },
                    { name: "Federal Education Grant Response 2026", status: "Awaiting SME", badge: "bg-amber-50 text-amber-600", bar: 80 },
                  ].map(({ name, status, badge, bar }) => (
                    <div key={name} className="flex items-center gap-4 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-800 truncate">{name}</div>
                        <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden w-full">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${bar}%` }} />
                        </div>
                      </div>
                      <div className={`text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${badge}`}>{status}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem ──────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">The problem</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              The RFP grind is real.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                heading: "You're rewriting the same answers.",
                body: "Every new RFP starts with a search through last quarter's response. Copy, adjust, repeat — for 40 hours straight.",
              },
              {
                heading: "Your experts are always unavailable.",
                body: "The one person who knows the technical answer is traveling. The deadline doesn't reschedule.",
              },
              {
                heading: "Effort doesn't guarantee a win.",
                body: "You can spend three weeks on a response and still lose to a team who spent three days. The difference isn't always effort.",
              },
            ].map(({ heading, body }) => (
              <div key={heading} className="rounded-2xl p-7 border border-gray-100 shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_0_rgba(0,0,0,0.1)] transition-shadow">
                <div className="w-8 h-1 bg-blue-600 rounded-full mb-5" />
                <h3 className="font-semibold text-gray-900 mb-3 text-[15px] leading-snug">{heading}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
              Everything your team needs to win more bids.
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Built around how high-win-rate teams actually work — not how software vendors think they should.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                title: "Your knowledge base, not generic answers",
                body: "Responses draw from your past work, your tone, your differentiators. Not a template that looks like everyone else's submission.",
              },
              {
                title: "Human review built into the workflow",
                body: "Every draft goes through your team before it goes out. You decide what ships. We accelerate the work; you own the relationship.",
              },
              {
                title: "Compliance flagged before it becomes a loss",
                body: "Mandatory requirements and evaluation criteria are caught automatically — so you don't discover a missed section at submission time.",
              },
              {
                title: "One workspace for the whole team",
                body: "SME answers, edits, approvals — tracked in one view. No more chasing replies over email or losing edits in shared drives.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="flex gap-4 p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_0_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_0_rgba(0,0,0,0.08)] transition-shadow">
                <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1.5">{title}</div>
                  <div className="text-sm text-gray-500 leading-relaxed">{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              From document to draft in minutes.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                heading: "Upload the RFP",
                body: "Drop in any PDF or Word document. We parse every requirement, evaluation criterion, and deadline — automatically.",
              },
              {
                step: "02",
                heading: "Review the draft",
                body: "Structured, tailored responses arrive pre-written. Your team edits — not authors. That's the 40-hour difference.",
              },
              {
                step: "03",
                heading: "Export and submit",
                body: "Download in Word, PDF, or PowerPoint — formatted and ready. No last-minute reformatting.",
              },
            ].map(({ step, heading, body }) => (
              <div key={step} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-[0_4px_20px_0_rgba(0,0,0,0.06)]">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-6">
                  <span className="text-xs font-bold text-blue-600">{step}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">{heading}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">What teams say</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Real results, not marketing copy.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                quote: "We cut our average RFP turnaround from 3 weeks to 4 days. The compliance check alone has saved us from two disqualifications.",
                name: "Sarah M.",
                role: "Proposals Director, Infrastructure firm",
                initials: "SM",
                color: "bg-blue-100 text-blue-700",
              },
              {
                quote: "Our SMEs used to be the bottleneck. Now they spend 30 minutes reviewing instead of 6 hours writing. Game changer for our win rate.",
                name: "James R.",
                role: "BD Manager, Management Consulting",
                initials: "JR",
                color: "bg-purple-100 text-purple-700",
              },
              {
                quote: "The knowledge base feature means we're actually building on past wins, not starting fresh every time. Our responses are getting sharper.",
                name: "Priya K.",
                role: "Head of Bids, IT Services",
                initials: "PK",
                color: "bg-emerald-100 text-emerald-700",
              },
            ].map(({ quote, name, role, initials, color }) => (
              <div key={name} className="bg-white rounded-2xl p-7 border border-gray-100 shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] flex flex-col">
                <p className="text-sm text-gray-600 leading-relaxed mb-6 flex-1">&ldquo;{quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                    {initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{name}</div>
                    <div className="text-xs text-gray-400">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3">
              Start free. Pay only when you win more.
            </h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
              No credit card for your first RFP. Upgrade when the value is obvious.
            </p>

            {/* Toggle */}
            <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setBilling("monthly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${billing === "monthly" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${billing === "yearly" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Yearly
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${billing === "yearly" ? "bg-white text-blue-600" : "bg-blue-100 text-blue-600"}`}>
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {plans[billing].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 flex flex-col ${plan.featured ? "bg-blue-600 text-white shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)]" : "bg-white border border-gray-200 shadow-[0_4px_20px_0_rgba(0,0,0,0.06)]"}`}
              >
                {plan.featured && (
                  <div className="text-[10px] font-bold tracking-widest uppercase text-blue-200 mb-4">Most popular</div>
                )}
                <div className="mb-6">
                  <div className={`text-xs font-semibold tracking-widest uppercase mb-3 ${plan.featured ? "text-blue-200" : "text-gray-400"}`}>
                    {plan.name}
                  </div>
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-bold ${plan.featured ? "text-white" : "text-gray-900"}`}>{plan.price}</span>
                    {plan.per && <span className={`text-sm pb-1 ${plan.featured ? "text-blue-200" : "text-gray-400"}`}>{plan.per}</span>}
                  </div>
                  <div className={`text-xs mt-1 ${plan.featured ? "text-blue-200" : "text-gray-400"}`}>{plan.note}</div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2.5 text-sm ${plan.featured ? "text-blue-100" : "text-gray-600"}`}>
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.featured ? "text-blue-200" : "text-blue-600"}`} strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block w-full text-center py-3 rounded-xl text-sm font-semibold transition-all ${plan.featured ? "bg-white text-blue-600 hover:bg-blue-50" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">FAQ</p>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Common questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((item, i) => (
              <div key={i} className={`bg-white rounded-2xl border transition-all ${openFaq === i ? "border-blue-100 shadow-[0_4px_20px_0_rgba(37,99,235,0.08)]" : "border-gray-100 shadow-sm"}`}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-semibold text-gray-900 text-sm pr-4">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6">
                    <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight tracking-tight mb-5">
            Your next proposal
            <br />deserves a better process.
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed mb-10">
            The first one is on us. No credit card, no commitment.
            Upload an RFP and see what comes back.
          </p>
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            Start writing — it&apos;s free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="7" fill="#2563eb"/>
              <rect x="7" y="8" width="6" height="5" rx="1.5" fill="white"/>
              <rect x="15" y="8" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.5"/>
              <rect x="7" y="15" width="14" height="2" rx="1" fill="white" fillOpacity="0.4"/>
              <rect x="7" y="19" width="10" height="2" rx="1" fill="white" fillOpacity="0.25"/>
            </svg>
            <span className="font-bold text-gray-900 text-sm">Propos</span>
          </div>

          <div className="flex items-center gap-6">
            {[["Features","#features"],["How it works","#how-it-works"],["Pricing","#pricing"],["FAQ","#faq"],["Sign in","/login"]].map(([label,href]) => (
              <a key={label} href={href} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">{label}</a>
            ))}
          </div>

          <p className="text-xs text-gray-400">© 2026 Propos. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
