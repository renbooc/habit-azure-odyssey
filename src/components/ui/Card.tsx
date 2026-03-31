import React from 'react';
import { cn } from '@/src/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'tonal';
}

export const Card: React.FC<CardProps> = ({ className, variant = 'default', children, ...props }) => {
  const variants = {
    default: 'bg-surface shadow-ambient',
    glass: 'glass-effect shadow-ambient',
    tonal: 'bg-surface-container-low',
  };

  return (
    <div
      className={cn('rounded-xl p-6', variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
};
