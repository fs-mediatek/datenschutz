"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";

export interface CustomNodeData {
  label: string;
  type: string;
  processId?: string | null;
  processName?: string | null;
}

const typeConfig: Record<
  string,
  { color: string; bg: string; border: string; icon: string; badgeLabel: string; rounded: string }
> = {
  process: {
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-400",
    icon: "\u2699\uFE0F",
    badgeLabel: "Prozess",
    rounded: "rounded-2xl",
  },
  system: {
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-400",
    icon: "\uD83D\uDDA5\uFE0F",
    badgeLabel: "System",
    rounded: "rounded-md",
  },
  person: {
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-400",
    icon: "\uD83D\uDC64",
    badgeLabel: "Person/Abt.",
    rounded: "rounded-2xl",
  },
  external: {
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-400",
    icon: "\uD83C\uDF10",
    badgeLabel: "Extern",
    rounded: "rounded-md",
  },
  datasource: {
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-400",
    icon: "\uD83D\uDDC4\uFE0F",
    badgeLabel: "Datenquelle",
    rounded: "rounded-md",
  },
  archive: {
    color: "text-gray-700",
    bg: "bg-gray-50",
    border: "border-gray-400",
    icon: "\uD83D\uDDD1\uFE0F",
    badgeLabel: "Archiv",
    rounded: "rounded-md",
  },
};

function CustomNode({ data, selected }: NodeProps<CustomNodeData>) {
  const config = typeConfig[data.type] || typeConfig.process;

  return (
    <div
      className={`
        px-4 py-3 shadow-md border-2 min-w-[160px] max-w-[220px]
        ${config.bg} ${config.border} ${config.rounded}
        ${selected ? "ring-2 ring-blue-500 ring-offset-2" : ""}
        transition-shadow
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-400 !border-white !border-2"
      />

      <div className="flex items-center gap-2">
        <span className="text-lg">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold truncate ${config.color}`}>
            {data.label}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${config.bg} ${config.color} border ${config.border} font-medium`}
            >
              {config.badgeLabel}
            </span>
            {data.processId && (
              <span className="text-[10px] text-blue-500" title="Verknüpft mit VVT-Prozess">
                🔗
              </span>
            )}
          </div>
          {data.processId && data.processName && (
            <div className="text-[10px] text-blue-600 mt-1 truncate">
              → {data.processName}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-slate-400 !border-white !border-2"
      />
    </div>
  );
}

export default memo(CustomNode);
