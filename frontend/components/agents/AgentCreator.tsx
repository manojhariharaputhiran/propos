"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CustomAgent } from "@/lib/api";
import { agentsApi } from "@/lib/api";

interface AgentCreatorProps {
  agent?: CustomAgent | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const AVAILABLE_TOOLS = [
  "retrieve_context",
  "draft_answer",
  "check_compliance",
  "flag_issues",
  "analyse_pricing",
  "suggest_structure",
  "search_knowledge_base",
  "validate_references",
];

export function AgentCreator({ agent, onSuccess, onCancel }: AgentCreatorProps) {
  const [name, setName] = useState(agent?.name || "");
  const [type, setType] = useState<"skill" | "critic">(agent?.type || "skill");
  const [systemPrompt, setSystemPrompt] = useState(agent?.system_prompt || "");
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>(agent?.trigger_keywords || []);
  const [tools, setTools] = useState<string[]>(agent?.tools || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddKeyword = () => {
    const kw = keywordInput.trim().toLowerCase();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
      setKeywordInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const toggleTool = (tool: string) => {
    setTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const handleSave = async () => {
    if (!name.trim() || !systemPrompt.trim()) {
      setError("Name and system prompt are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        type,
        system_prompt: systemPrompt.trim(),
        trigger_keywords: keywords,
        tools,
      };

      if (agent) {
        await agentsApi.update(agent.id, payload);
      } else {
        await agentsApi.create(payload);
      }

      onSuccess();
    } catch {
      setError("Failed to save agent. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">
            {agent ? "Edit Agent" : "Create New Agent"}
          </h3>
        </div>
        <Button size="icon" variant="ghost" onClick={onCancel} className="w-7 h-7">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="agent-name">Agent Name *</Label>
          <Input
            id="agent-name"
            placeholder="e.g. Healthcare Copywriter"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Type */}
        <div className="space-y-1.5">
          <Label>Agent Type *</Label>
          <Select value={type} onValueChange={(v) => setType(v as "skill" | "critic")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="skill">Skill (drafting specialist)</SelectItem>
              <SelectItem value="critic">Critic (review & scoring)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* System prompt */}
      <div className="space-y-1.5">
        <Label htmlFor="system-prompt">System Prompt *</Label>
        <Textarea
          id="system-prompt"
          placeholder="Describe this agent's persona, expertise, and instructions..."
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={5}
          className="text-sm"
        />
        <p className="text-xs text-gray-400">
          This is the instruction set that defines how the agent behaves when processing questions.
        </p>
      </div>

      {/* Trigger keywords */}
      <div className="space-y-2">
        <Label>Trigger Keywords</Label>
        <p className="text-xs text-gray-400">
          This agent will activate when questions contain these keywords.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Add keyword..."
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-sm"
          />
          <Button size="sm" variant="outline" onClick={handleAddKeyword} disabled={!keywordInput.trim()}>
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((kw, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md"
              >
                {kw}
                <button
                  onClick={() => setKeywords(keywords.filter((_, j) => j !== i))}
                  className="text-blue-400 hover:text-blue-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tools */}
      <div className="space-y-2">
        <Label>Tools</Label>
        <p className="text-xs text-gray-400">Select the tools this agent can use.</p>
        <div className="grid grid-cols-2 gap-1.5">
          {AVAILABLE_TOOLS.map((tool) => (
            <button
              key={tool}
              onClick={() => toggleTool(tool)}
              className={`text-xs px-3 py-2 rounded-lg border text-left transition-all ${
                tools.includes(tool)
                  ? "bg-green-50 border-green-300 text-green-700 font-medium"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {tools.includes(tool) ? "✓ " : ""}{tool}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            agent ? "Save Changes" : "Create Agent"
          )}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
