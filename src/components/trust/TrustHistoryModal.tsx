import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  History,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useTrust } from "@/src/context/TrustContext";
import type { TrustHistoryItem } from "@/src/context/TrustContext";

interface TrustHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LEVEL_COLORS: Record<string, string> = {
  vigilance: "text-red-500",
  sprouting: "text-orange-400",
  stable: "text-cyan-400",
  trustworthy: "text-violet-400",
  star_messenger: "text-amber-300",
};

const getTriggerBadge = (triggered_by: string) => {
  switch (triggered_by) {
    case "system":
      return {
        label: "系统",
        className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      };
    case "parent":
      return {
        label: "家长",
        className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      };
    case "child":
      return {
        label: "孩子",
        className: "bg-green-500/10 text-green-400 border-green-500/20",
      };
    default:
      return {
        label: triggered_by,
        className: "bg-white/10 text-white/60 border-white/10",
      };
  }
};

const formatTime = (timestamp: string) => {
  try {
    const d = new Date(timestamp);
    return d.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return timestamp;
  }
};

const TrustHistoryItem: React.FC<{ item: TrustHistoryItem; index: number }> = ({
  item,
  index,
}) => {
  const isPositive = item.delta > 0;
  const isNegative = item.delta < 0;
  const triggerInfo = getTriggerBadge(item.triggered_by);
  const DeltaIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 hover:shadow-sm transition-all"
    >
      {/* Delta icon */}
      <div
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border",
          isPositive
            ? "bg-green-500/10 text-green-400 border-green-500/20"
            : isNegative
              ? "bg-red-500/10 text-red-400 border-red-500/20"
              : "bg-white/5 text-white/40 border-white/10",
        )}
      >
        <DeltaIcon size={16} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={cn(
              "font-bold text-sm",
              isPositive
                ? "text-green-400"
                : isNegative
                  ? "text-red-400"
                  : "text-white/60",
            )}
          >
            {isPositive ? "+" : ""}
            {item.delta}
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${triggerInfo.className}`}
          >
            {triggerInfo.label}
          </span>
        </div>
        <p className="text-[12px] text-white/70 font-medium leading-tight line-clamp-2">
          {item.reason}
        </p>
        <p className="text-[10px] text-white/40 font-semibold mt-1">
          {formatTime(item.timestamp)}
        </p>
      </div>

      {/* Score before → after */}
      <div className="flex flex-col items-end flex-shrink-0">
        <span className="text-[10px] text-white/40 font-bold">差值</span>
        <div className="flex items-center gap-1 text-xs font-bold text-white/80">
          <span>{item.score_before}</span>
          <span className="text-white/30">→</span>
          <span>{item.score_after}</span>
        </div>
      </div>
    </motion.div>
  );
};

export const TrustHistoryModal: React.FC<TrustHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { trustStatus, loading } = useTrust();

  if (!isOpen) return null;

  const history = trustStatus?.trust_history || [];
  const levelColorClass =
    LEVEL_COLORS[trustStatus?.trust_level || "stable"] || "text-cyan-400";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-surface rounded-[24px] w-full max-w-md p-6 space-y-5 shadow-2xl relative max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-surface-container-high rounded-full text-on-surface-variant hover:text-on-surface transition-colors focus:outline-none"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-4">
              <Shield className={levelColorClass} size={24} />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-on-surface tracking-tight">
                  信任指数
                </h3>
                {trustStatus && (
                  <p className="text-sm text-on-surface-variant/80 font-medium">
                    当前 {trustStatus.trust_level_title} · 信任分{" "}
                    {trustStatus.trust_score} · 积分 ×{trustStatus.multiplier}
                  </p>
                )}
              </div>
            </div>

            {/* Trust score history */}
            <div className="flex items-center gap-2 text-sm font-bold text-on-surface-variant/80">
              <History size={16} />
              <span>变动流水</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar pr-2 pb-2">
              {loading && history.length === 0 ? (
                <div className="py-10 text-center text-on-surface-variant/60 font-bold border border-outline-variant/30 rounded-xl bg-surface-container-low/50">
                  查询中...
                </div>
              ) : history.length === 0 ? (
                <div className="py-10 text-center text-on-surface-variant/60 font-bold border border-outline-variant/30 rounded-xl bg-surface-container-low/50">
                  暂无信任变动记录 🍃
                </div>
              ) : (
                history.map((item, idx) => (
                  <TrustHistoryItem key={idx} item={item} index={idx} />
                ))
              )}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 pt-2 border-t border-outline-variant/20 text-[10px] font-bold text-on-surface-variant/60">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400" /> 系统
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400" /> 家长
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400" /> 孩子
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TrustHistoryModal;
