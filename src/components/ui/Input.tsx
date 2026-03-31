import React from 'react';
import { cn } from '@/src/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, icon, error, ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        {label && (
          <label className="block text-sm font-semibold text-on-primary-container ml-4">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant/60">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-surface-container-low border-none rounded-full py-4 focus:bg-surface focus:ring-2 focus:ring-primary/20 transition-all text-on-surface placeholder:text-on-surface-variant/40',
              icon ? 'pl-14 pr-6' : 'px-6',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-500 ml-4">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
