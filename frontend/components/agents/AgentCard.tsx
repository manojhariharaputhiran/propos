"use client";

import React from "react";
import { Bot, Power, PowerOff, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CustomAgent } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";

interface AgentCardProps {
  agent: CustomAgent;
  onEdit: (agent: CustomAgent) => void;
  onDisable: (agentId: string) => void;
  onDelete: (agentId: string) => void;
}

export function AgentCard({ agent, onEdit, onDisable, onDelete }: AgentCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-xl border p-5 transition-all",
      agent.is_active ? "border-gray-200" : "border-gray-100 opacity-60"
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            agent.type === "skill" ? "bg-blue-100" : "bg-purple-100"
          )}>
            <Bot className={cn(
              "w-5 h-5",
              agent.type === "skill" ? "text-blue-600" : "text-purple-600"
            )} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900">{agent.name}</h3>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                agent.type === "skill"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700"
              )}>
                {agent.type}
              </span>
              {!agent.is_active && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  Disabled
                </span>
              )}
            </div>

            {agent.system_prompt && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{agent.system_prompt}</p>
            )}

            {agent.trigger_keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {agent.trigger_keywords.slice(0, 5).map((kw, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                    {kw}
                  </span>
                ))}
                {agent.trigger_keywords.length > 5 && (
                  <span className="text-xs text-gray-400">+{agent.trigger_keywords.length - 5} more</span>
                )}
              </div>
            )}

            <p className="text-xs text-gray-400 mt-2">Created {formatRelativeTime(agent.created_at)}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(agent)}
            className="w-8 h-8 text-gray-400 hover:text-blue-600"
            title="Edit agent"
          >
            <Edit2 className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDisable(agent.id)}
            className={cn(
              "w-8 h-8",
              agent.is_active
                ? "text-gray-400 hover:text-orange-500"
                : "text-orange-400 hover:text-green-600"
            )}
            title={agent.is_active ? "Disable agent" : "Enable agent"}
          >
            {agent.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(agent.id)}
            className="w-8 h-8 text-gray-400 hover:text-red-500"
            title="Delete agent"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tools */}
      {agent.tools.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-1.5">Tools</p>
          <div className="flex flex-wrap gap-1">
            {agent.tools.map((tool, i) => (
              <span key={i} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-md">
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
