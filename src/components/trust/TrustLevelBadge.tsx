import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useTrust } from '@/src/context/TrustContext';
import { Shield } from 'lucide-react';

interface TrustLevelBadgeProps {
  className?: string;
  onClick?: () => void;
  showScore?: boolean;
}

const LEVEL_STYLES: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  vigilance:      { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/20', glow: 'shadow-red-500/20' },
  sprouting:      { bg: 'bg-orange-400/15', text: 'text-orange-400', border: 'border-orange-400/20', glow: 'shadow-orange-400/20' },
  stable:         { bg: 'bg-cyan-400/15', text: 'text-cyan-400', border: 'border-cyan-400/20', glow: 'shadow-cyan-400/20' },
  trustworthy:    { bg: 'bg-violet-400/15', text: 'text-violet-400', border: 'border-violet-400/20', glow: 'shadow-violet-400/20' },
  star_messenger: { bg: 'bg-amber-300/15', text: 'text-amber-300', border: 'border-amber-300/20', glow: 'shadow-amber-300/20' },
};

export const TrustLevelBadge: React.FC<TrustLevelBadgeProps> = ({
  className,
  onClick,
  showScore = true,
}) => {
  const { trustStatus, loading } = useTrust();

  if (loading || !trustStatus) {
    return (
      <div className={cn('h-7 w-28 animate-pulse rounded-full bg-surface-container-high/50', className)} />
    );
  }

  const { trust_score, trust_level_title, trust_level } = trustStatus;
  const style = LEVEL_STYLES[trust_level] || LEVEL_STYLES.stable;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-sm',
        style.bg,
        style.text,
        style.border,
        style.glow,
        onClick ? 'cursor-pointer' : 'cursor-default',
        className
      )}
    >
      <Shield size={12} className="fill-current" />
      <span>{trust_level_title}</span>
      {showScore && (
        <>
          <span className="text-white/30 mx-0.5">·</span>
          <span className="font-black">{trust_score}</span>
        </>
      )}
    </motion.button>
  );
};

export default TrustLevelBadge;
