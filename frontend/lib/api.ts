/**
 * API client for the RFP Automation backend.
 * All calls include Bearer token from next-auth session.
 */
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { getSession } from "next-auth/react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_PREFIX = "/api/v1";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Question {
  id: string;
  rfp_id: string;
  text: string;
  draft_answer: string | null;
  confidence: number | null;
  needs_sme: boolean;
  sme_provided_answer: string | null;
  final_answer: string | null;
  sort_order: number;
}

export interface CriticReport {
  win_probability: number;
  completeness: number;
  persuasiveness: number;
  compliance: number;
  suggestions: string[];
  critical_flags: string[];
}

export interface RFP {
  id: string;
  org_id: string;
  status: RFPStatus;
  title: string | null;
  file_name: string | null;
  raw_text: string | null;
  critic_report: CriticReport | null;
  export_format: string | null;
  created_at: string;
  updated_at: string;
  questions: Question[];
}

export interface RFPSummary {
  id: string;
  org_id: string;
  status: RFPStatus;
  title: string | null;
  file_name: string | null;
  created_at: string;
  updated_at: string;
  question_count: number;
  critic_report: CriticReport | null;
}

export type RFPStatus =
  | "uploaded"
  | "parsing"
  | "qualification_needed"
  | "qualified"
  | "drafting"
  | "sme_needed"
  | "critic_done"
  | "human_review"
  | "export_ready"
  | "completed"
  | "rejected"
  | "error";

export interface DashboardStats {
  total: number;
  in_progress: number;
  completed: number;
  needs_review: number;
}

export interface CustomAgent {
  id: string;
  org_id: string;
  name: string;
  type: "skill" | "critic";
  system_prompt: string | null;
  trigger_keywords: string[];
  tools: string[];
  is_active: boolean;
  created_at: string;
}

export interface Organisation {
  id: string;
  name: string;
  brand_voice: string;
  default_ppt_template_url: string | null;
  created_at: string;
}

// ── Client factory ────────────────────────────────────────────────────────────

async function createClient(): Promise<AxiosInstance> {
  let token: string | undefined;

  if (typeof window !== "undefined") {
    const session = await getSession();
    token = session?.apiToken;
  }

  const client = axios.create({
    baseURL: `${BASE_URL}${API_PREFIX}`,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return client;
}

// Simpler version for server components
function createServerClient(token?: string): AxiosInstance {
  return axios.create({
    baseURL: `${BASE_URL}${API_PREFIX}`,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

// ── RFP API ───────────────────────────────────────────────────────────────────

export const rfpApi = {
  async upload(file: File, title?: string): Promise<RFP> {
    // Use native fetch — axios inherits global Content-Type:application/json defaults
    // even on new instances, which breaks multipart boundary. fetch has no such issue.
    let token: string | undefined;
    if (typeof window !== "undefined") {
      const session = await getSession();
      token = session?.apiToken;
    }
    const form = new FormData();
    form.append("file", file);
    if (title) form.append("title", title);

    const res = await fetch(`${BASE_URL}${API_PREFIX}/rfp/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw Object.assign(new Error(`Request failed with status code ${res.status}`), {
        response: { status: res.status, data: err },
      });
    }
    return res.json();
  },

  async list(): Promise<RFPSummary[]> {
    const client = await createClient();
    const res = await client.get("/rfp/");
    return res.data;
  },

  async getStatus(id: string): Promise<RFP> {
    const client = await createClient();
    const res = await client.get(`/rfp/${id}/status`);
    return res.data;
  },

  async getDraft(id: string): Promise<RFP> {
    const client = await createClient();
    const res = await client.get(`/rfp/${id}/draft`);
    return res.data;
  },

  async qualify(id: string, proceed: boolean, reason?: string): Promise<{ message: string }> {
    const client = await createClient();
    const res = await client.post(`/rfp/${id}/qualify`, { proceed, reason });
    return res.data;
  },

  async submitSMEAnswer(rfpId: string, questionId: string, answer: string): Promise<{ message: string; remaining_sme: number }> {
    const client = await createClient();
    const res = await client.post(`/rfp/${rfpId}/sme-answer`, {
      question_id: questionId,
      answer,
    });
    return res.data;
  },

  async approve(id: string, approved: boolean, notes?: string): Promise<{ message: string }> {
    const client = await createClient();
    const res = await client.post(`/rfp/${id}/approve`, { approved, notes });
    return res.data;
  },

  async export(id: string, format: "word" | "pdf" | "ppt" | "sheets"): Promise<Blob> {
    const client = await createClient();
    const res = await client.get(`/rfp/${id}/export`, {
      params: { format },
      responseType: "blob",
    });
    return res.data;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const client = await createClient();
    const res = await client.get("/rfp/stats/dashboard");
    return res.data;
  },
};

// ── Agents API ────────────────────────────────────────────────────────────────

export const agentsApi = {
  async list(): Promise<CustomAgent[]> {
    const client = await createClient();
    const res = await client.get("/agents/");
    return res.data;
  },

  async create(data: {
    name: string;
    type: "skill" | "critic";
    system_prompt: string;
    trigger_keywords: string[];
    tools: string[];
  }): Promise<CustomAgent> {
    const client = await createClient();
    const res = await client.post("/agents/", data);
    return res.data;
  },

  async update(id: string, data: Partial<CustomAgent>): Promise<CustomAgent> {
    const client = await createClient();
    const res = await client.put(`/agents/${id}`, data);
    return res.data;
  },

  async disable(id: string): Promise<CustomAgent> {
    const client = await createClient();
    const res = await client.post(`/agents/${id}/disable`);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    const client = await createClient();
    await client.delete(`/agents/${id}`);
  },
};

// ── Organisation API ──────────────────────────────────────────────────────────

export const orgApi = {
  async get(): Promise<Organisation> {
    const client = await createClient();
    const res = await client.get("/organisation/");
    return res.data;
  },

  async uploadTemplate(file: File): Promise<{ message: string; filename: string }> {
    const client = await createClient();
    const form = new FormData();
    form.append("file", file);
    const res = await client.post("/organisation/templates/ppt", form, {
      headers: { "Content-Type": undefined },
    });
    return res.data;
  },

  async listTemplates(): Promise<{ templates: Array<{ id: string; name: string; path: string; is_default: boolean }> }> {
    const client = await createClient();
    const res = await client.get("/organisation/templates");
    return res.data;
  },

  async updateBrandVoice(brandVoice: string): Promise<{ message: string; brand_voice: string }> {
    const client = await createClient();
    const form = new FormData();
    form.append("brand_voice", brandVoice);
    const res = await client.put("/organisation/brand-voice", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return res.data;
  },
};

// ── Helper: trigger file download ─────────────────────────────────────────────
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// ── Status display helpers ────────────────────────────────────────────────────
export const STATUS_LABELS: Record<RFPStatus, string> = {
  uploaded: "Uploaded",
  parsing: "Parsing",
  qualification_needed: "Awaiting Go/No-Go",
  qualified: "Qualified",
  drafting: "Drafting",
  sme_needed: "Awaiting SME",
  critic_done: "Review Ready",
  human_review: "Human Review",
  export_ready: "Export Ready",
  completed: "Completed",
  rejected: "Rejected",
  error: "Error",
};

export const STATUS_COLORS: Record<RFPStatus, string> = {
  uploaded: "bg-gray-100 text-gray-700",
  parsing: "bg-blue-100 text-blue-700",
  qualification_needed: "bg-yellow-100 text-yellow-700",
  qualified: "bg-cyan-100 text-cyan-700",
  drafting: "bg-indigo-100 text-indigo-700",
  sme_needed: "bg-orange-100 text-orange-700",
  critic_done: "bg-purple-100 text-purple-700",
  human_review: "bg-amber-100 text-amber-700",
  export_ready: "bg-green-100 text-green-700",
  completed: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  error: "bg-red-100 text-red-700",
};
