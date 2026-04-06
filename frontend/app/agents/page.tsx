"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Bot, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentCard } from "@/components/agents/AgentCard";
import { AgentCreator } from "@/components/agents/AgentCreator";
import { agentsApi, type CustomAgent } from "@/lib/api";

export default function AgentsPage() {
  const [agents, setAgents] = useState<CustomAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [editingAgent, setEditingAgent] = useState<CustomAgent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const data = await agentsApi.list();
      setAgents(data);
      setError(null);
    } catch {
      setError("Failed to load agents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleEdit = (agent: CustomAgent) => {
    setEditingAgent(agent);
    setShowCreator(true);
  };

  const handleDisable = async (agentId: string) => {
    try {
      await agentsApi.disable(agentId);
      await fetchAgents();
    } catch {
      setError("Failed to disable agent.");
    }
  };

  const handleDelete = async (agentId: string) => {
    if (!confirm("Delete this agent? This cannot be undone.")) return;
    try {
      await agentsApi.delete(agentId);
      await fetchAgents();
    } catch {
      setError("Failed to delete agent.");
    }
  };

  const handleSuccess = () => {
    setShowCreator(false);
    setEditingAgent(null);
    fetchAgents();
  };

  const handleCancel = () => {
    setShowCreator(false);
    setEditingAgent(null);
  };

  const activeAgents = agents.filter((a) => a.is_active);
  const inactiveAgents = agents.filter((a) => !a.is_active);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Agent Creator</h1>
                <p className="text-sm text-gray-500">
                  Build custom AI agents for your proposals
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchAgents}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Refresh
              </Button>
              {!showCreator && (
                <Button size="sm" onClick={() => setShowCreator(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  New Agent
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Agent creator form */}
        {showCreator && (
          <AgentCreator
            agent={editingAgent}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Agents", value: agents.length, color: "text-gray-700" },
            { label: "Active", value: activeAgents.length, color: "text-green-600" },
            { label: "Disabled", value: inactiveAgents.length, color: "text-gray-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Active agents */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
            Active Agents ({activeAgents.length})
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
            </div>
          ) : activeAgents.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center">
              <Bot className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No active agents</p>
              <p className="text-sm text-gray-400 mt-1">Create your first custom agent to specialise the AI</p>
            </div>
          ) : (
            activeAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onEdit={handleEdit}
                onDisable={handleDisable}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Inactive agents */}
        {inactiveAgents.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-400 text-sm uppercase tracking-wide">
              Disabled Agents ({inactiveAgents.length})
            </h2>
            {inactiveAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onEdit={handleEdit}
                onDisable={handleDisable}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
