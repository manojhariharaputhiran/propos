"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  FileText, Upload, TrendingUp, CheckCircle2, Clock, AlertCircle,
  Plus, LayoutDashboard, Bot, Layers, LogOut, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RFPStatusBadge } from "@/components/rfp/RFPStatus";
import { rfpApi, type RFPSummary, type DashboardStats } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { signOut } from "next-auth/react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [rfps, setRfps] = useState<RFPSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
  }, [status]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rfpList, dashStats] = await Promise.all([
        rfpApi.list(),
        rfpApi.getDashboardStats(),
      ]);
      setRfps(rfpList);
      setStats(dashStats);
    } catch {
      setError("Failed to load dashboard data. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchData();
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">RFP Auto</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", active: true },
            { href: "/rfp/upload", icon: Upload, label: "Upload RFP" },
            { href: "/agents", icon: Bot, label: "Agents" },
            { href: "/templates", icon: Layers, label: "Templates" },
          ].map(({ href, icon: Icon, label, active }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-2 px-3 py-2 mb-2">
            <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
              {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {session?.user?.name || session?.user?.email || "User"}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-500 text-sm mt-1">Manage your RFP responses</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Link href="/rfp/upload">
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  New RFP
                </Button>
              </Link>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Empty state — shown instead of stats when no RFPs */}
          {!loading && rfps.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-5">
                <Upload className="w-7 h-7 text-blue-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Upload your first RFP</h2>
              <p className="text-sm text-gray-500 max-w-xs mb-6">
                Drop in a PDF or Word doc and get a full draft proposal back in minutes.
              </p>
              <Link href="/rfp/upload">
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload RFP
                </Button>
              </Link>
            </div>
          )}

          {/* Stats + list — only shown when RFPs exist */}
          {rfps.length > 0 && (
            <>
              {stats && (
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Total", value: stats.total, icon: FileText, color: "text-gray-600", bg: "bg-gray-100" },
                    { label: "In progress", value: stats.in_progress, icon: Clock, color: "text-blue-600", bg: "bg-blue-100" },
                    { label: "Needs review", value: stats.needs_review, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-100" },
                    { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
                  ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-500">{label}</span>
                        <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${color}`} />
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Your proposals</h2>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  </div>
                ) : (
              <div className="divide-y divide-gray-100">
                {rfps.map((rfp) => (
                  <Link key={rfp.id} href={`/rfp/${rfp.id}`} className="block">
                    <div className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {rfp.title || rfp.file_name || "Untitled RFP"}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-400">
                            {rfp.question_count} questions
                          </span>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-400">
                            {formatRelativeTime(rfp.updated_at)}
                          </span>
                          {rfp.critic_report && (
                            <>
                              <span className="text-xs text-gray-300">·</span>
                              <span className="text-xs text-blue-600 flex items-center gap-0.5">
                                <TrendingUp className="w-3 h-3" />
                                {rfp.critic_report.win_probability}% win
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <RFPStatusBadge status={rfp.status} />
                    </div>
                  </Link>
                ))}
              </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
