"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
  </svg>
);

function LoginForm() {
  const [loading, setLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const handleSignIn = async (provider: string, extra?: Record<string, string>) => {
    setLoading(provider);
    await signIn(provider, { callbackUrl: "/dashboard", ...extra });
    setLoading(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">

      {/* Back */}
      <div className="w-full max-w-sm mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </Link>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-[0_4px_24px_0_rgba(0,0,0,0.06)] p-8">

        {/* Logo */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="7" fill="#2563eb"/>
              <rect x="7" y="8" width="6" height="5" rx="1.5" fill="white"/>
              <rect x="15" y="8" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.5"/>
              <rect x="7" y="15" width="14" height="2" rx="1" fill="white" fillOpacity="0.4"/>
              <rect x="7" y="19" width="10" height="2" rx="1" fill="white" fillOpacity="0.25"/>
            </svg>
            <span className="font-bold text-gray-900 tracking-tight">Propos</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Sign in to your workspace</h1>
          <p className="text-sm text-gray-500">Welcome back. Pick up right where you left off.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            Sign-in failed. Please try again.
          </div>
        )}

        {/* OAuth buttons */}
        <div className="space-y-2.5">
          <button
            onClick={() => handleSignIn("google")}
            disabled={!!loading}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
          >
            <span className="flex-shrink-0 w-5 flex items-center justify-center">
              {loading === "google" ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <GoogleIcon />}
            </span>
            Continue with Google
          </button>

          <button
            onClick={() => handleSignIn("azure-ad")}
            disabled={!!loading}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
          >
            <span className="flex-shrink-0 w-5 flex items-center justify-center">
              {loading === "azure-ad" ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <MicrosoftIcon />}
            </span>
            Continue with Microsoft
          </button>

          {/* Dev login separator */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <button
            onClick={() => handleSignIn("dev-login", { email: "demo@example.com" })}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 border border-dashed border-gray-200 transition-all disabled:opacity-50"
          >
            {loading === "dev-login" && <Loader2 className="w-4 h-4 animate-spin" />}
            Continue as demo user
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          By continuing, you agree to our{" "}
          <span className="underline cursor-pointer hover:text-gray-600 transition-colors">Terms</span>
          {" "}and{" "}
          <span className="underline cursor-pointer hover:text-gray-600 transition-colors">Privacy Policy</span>.
        </p>
      </div>

      <p className="mt-6 text-sm text-gray-400">
        New here?{" "}
        <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
          Learn how it works
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
