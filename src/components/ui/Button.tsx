import React from 'react';
import { cn } from '@/src/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth, ...props }, ref) => {
    const variants = {
      primary: 'primary-gradient text-on-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95',
      secondary: 'bg-secondary-container text-secondary hover:bg-secondary-container/80 active:scale-95',
      ghost: 'bg-transparent text-primary hover:bg-primary/5',
      outline: 'bg-transparent border-2 border-primary/20 text-primary hover:border-primary',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-4 text-base font-bold',
      lg: 'px-8 py-6 text-lg font-black',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'rounded-full transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
