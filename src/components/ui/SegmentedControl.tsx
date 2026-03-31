import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface SegmentedControlProps<T> {
    options: { label: React.ReactNode; value: T; icon?: React.ReactNode }[];
    value: T;
    onChange: (value: T) => void;
    className?: string;
    activeColor?: string;
    secondaryColor?: string;
}

export const SegmentedControl = <T extends string>({
    options,
    value,
    onChange,
    className,
    activeColor = 'bg-primary'
}: SegmentedControlProps<T>) => {
    const activeIndex = options.findIndex(opt => opt.value === value);

    return (
        <div className={cn("relative flex bg-surface-container-low p-1 rounded-2xl border border-outline-variant/30 overflow-hidden", className)}>
            <motion.div
                className={cn("absolute inset-y-1 rounded-xl shadow-sm z-0", activeColor)}
                style={{ width: `calc(${100 / options.length}% - 4px)` }}
                initial={false}
                animate={{ x: `${activeIndex * 100}%` }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
            {options.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={cn(
                        "flex-1 py-2 text-[11px] font-black rounded-lg transition-colors z-10 flex items-center justify-center gap-1.5",
                        value === option.value ? "text-white" : "text-on-surface-variant hover:bg-surface-container/50"
                    )}
                >
                    {option.icon}
                    {option.label}
                </button>
            ))}
        </div>
    );
};
