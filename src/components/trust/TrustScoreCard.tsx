import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useTrust, TrustLevelInfo } from '@/src/context/TrustContext';
import { Shield, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrustScoreCardProps {
  className?: string;
  compact?: boolean;
}

const LEVEL_COLORS: Record<string, { bg: string; ring: string; text: string; glow: string }> = {
  vigilance:      { bg: 'from-red-500/20 to-red-600/10', ring: '#ef4444', text: 'text-red-500', glow: 'rgba(239,68,68,0.3)' },
  sprouting:      { bg: 'from-orange-400/20 to-orange-500/10', ring: '#f97316', text: 'text-orange-400', glow: 'rgba(249,115,22,0.3)' },
  stable:         { bg: 'from-cyan-400/20 to-blue-500/10', ring: '#06b6d4', text: 'text-cyan-400', glow: 'rgba(6,182,212,0.3)' },
  trustworthy:    { bg: 'from-violet-400/20 to-purple-500/10', ring: '#8b5cf6', text: 'text-violet-400', glow: 'rgba(139,92,246,0.3)' },
  star_messenger: { bg: 'from-amber-300/20 to-yellow-400/10', ring: '#fbbf24', text: 'text-amber-300', glow: 'rgba(251,191,36,0.4)' },
};

const getLevelColor = (level: string) => LEVEL_COLORS[level] || LEVEL_COLORS.stable;

export const TrustScoreCard: React.FC<TrustScoreCardProps> = ({ className, compact = false }) => {
  const { trustStatus, loading } = useTrust();

  if (loading && !trustStatus) {
    return (
      <div className={cn('animate-pulse rounded-2xl bg-surface-container-high/50', compact ? 'h-16 w-32' : 'h-48', className)} />
    );
  }

  if (!trustStatus) return null;

  const { trust_score, trust_level_title, multiplier, trust_level } = trustStatus;
  const colors = getLevelColor(trust_level);
  const radius = compact ? 36 : 60;
  const strokeWidth = compact ? 5 : 8;
  const circumference = 2 * Math.PI * radius;
  const progress = trust_score / 100;
  const offset = circumference * (1 - progress);

  // 最近一次变动
  const lastChange = trustStatus.trust_history?.[0];
  const ChangeIcon = lastChange
    ? lastChange.delta > 0 ? TrendingUp : lastChange.delta < 0 ? TrendingDown : Minus
    : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative overflow-hidden rounded-2xl p-5',
        `bg-gradient-to-br ${colors.bg}`,
        'border border-white/10 backdrop-blur-sm',
        className
      )}
    >
      {/* Glow effect */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-50"
        style={{ background: colors.glow }}
      />

      <div className="relative z-10 flex flex-col items-center gap-3">
        {/* SVG Ring */}
        <div className={cn('relative', compact ? 'w-20 h-20' : 'w-32 h-32')}>
          <svg
            width="100%"
            height="100%"
            viewBox={compact ? '0 0 80 80' : '0 0 136 136'}
            className="-rotate-90"
          >
            {/* Background ring */}
            <circle
              cx={compact ? 40 : 68}
              cy={compact ? 40 : 68}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-white/10"
            />
            {/* Progress ring */}
            <motion.circle
              cx={compact ? 40 : 68}
              cy={compact ? 40 : 68}
              r={radius}
              fill="none"
              stroke={colors.ring}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </svg>
          {/* Center content */}
          <div className={cn(
            'absolute inset-0 flex flex-col items-center justify-center',
            compact ? 'gap-0' : 'gap-0.5'
          )}>
            <span className={cn('font-black tracking-tight', colors.text, compact ? 'text-2xl' : 'text-4xl')}>
              {trust_score}
            </span>
            {!compact && (
              <span className="text-[10px] font-bold text-white/60 tracking-widest uppercase">信任分</span>
            )}
          </div>
        </div>

        {/* Level info */}
        <div className="flex items-center gap-2">
          <Shield size={compact ? 14 : 16} className={colors.text} />
          <span className={cn('font-bold tracking-tight', compact ? 'text-xs' : 'text-sm', colors.text)}>
            {trust_level_title}
          </span>
        </div>

        {/* Multiplier badge */}
        {multiplier !== 1.0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              'px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider',
              multiplier > 1 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            )}
          >
            积分 ×{multiplier}
          </motion.div>
        )}

        {multiplier === 1.0 && (
          <div className="px-3 py-0.5 rounded-full bg-white/10 text-[10px] font-black tracking-wider text-white/50">
            积分 ×{multiplier}
          </div>
        )}

        {/* Last change indicator */}
        {lastChange && !compact && (
          <div className="flex items-center gap-1.5 text-[11px] text-white/60 mt-1">
            <ChangeIcon size={12} className={lastChange.delta > 0 ? 'text-green-400' : lastChange.delta < 0 ? 'text-red-400' : 'text-white/40'} />
            <span className="font-semibold">
              {lastChange.delta > 0 ? '+' : ''}{lastChange.delta}
            </span>
            <span className="text-white/40">·</span>
            <span className="truncate max-w-[120px]">{lastChange.reason}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TrustScoreCard;
