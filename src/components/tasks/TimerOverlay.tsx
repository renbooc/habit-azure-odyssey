import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, X, Clock } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface TimerOverlayProps {
    title: string;
    remaining: number;
    isPaused: boolean;
    onTogglePause: () => void;
    onCancel: () => void;
}

export const TimerOverlay = ({ title, remaining, isPaused, onTogglePause, onCancel }: TimerOverlayProps) => {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6"
        >
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
            <div className="absolute top-8 right-8 z-10">
                <button
                    onClick={onCancel}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white/60 hover:text-white transition-all shadow-lg"
                    title="退出专注"
                >
                    <X size={24} />
                </button>
            </div>

            <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="relative z-10 flex flex-col items-center text-center max-w-sm w-full"
            >
                <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-primary/20">
                    <Clock size={48} className="text-primary animate-pulse" />
                </div>
                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">{title}</h2>
                <p className="text-primary font-bold tracking-[0.2em] mb-12 uppercase text-xs">沉浸专注模式</p>

                <div className="relative mb-16">
                    <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
                    <span className="relative text-7xl sm:text-8xl font-black text-white tabular-nums tracking-tighter drop-shadow-2xl">
                        {formatTime(remaining)}
                    </span>
                </div>

                <button
                    onClick={onTogglePause}
                    className={cn(
                        "w-24 h-24 rounded-full flex items-center justify-center transition-all",
                        isPaused ? "bg-primary text-white scale-110 shadow-lg shadow-primary/50" : "bg-white/20 text-white hover:bg-white/30"
                    )}
                >
                    {isPaused ? <Play size={40} className="ml-2" /> : <Pause size={40} />}
                </button>
                <p className="mt-8 text-white/40 text-sm font-bold tracking-wide">
                    {isPaused ? '已暂停' : '保持专注，不要离开此页面'}
                </p>
            </motion.div>
        </motion.div>
    );
};
