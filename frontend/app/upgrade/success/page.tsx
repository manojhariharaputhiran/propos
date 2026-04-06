"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function UpgradeSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-9 h-9 text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re all set</h1>
        <p className="text-gray-500 text-sm mb-8">
          Your subscription is active. Start submitting as many proposals as you need.
        </p>
        <Link
          href="/rfp/upload"
          className="inline-flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          Upload your next RFP
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center w-full text-gray-500 hover:text-gray-700 text-sm mt-3 transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
