import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Play, Trash2, Clock, Star } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { cn } from '@/src/lib/utils';

// Icon Map for dynamic icons
const iconMap: Record<string, any> = {
    Star, Clock, CheckCircle2, Play
};

interface Task {
    id: string;
    title: string;
    points: number;
    icon: string;
    completed: boolean;
    task_type?: 'checkbox' | 'timer';
    target_duration?: number;
}

interface TaskCardProps {
    task: Task;
    role?: string;
    onToggle: () => void;
    onStartTimer: () => void;
    onDelete: () => void;
}

export const TaskCard = ({ task, role, onToggle, onStartTimer, onDelete }: TaskCardProps) => {
    const IconComponent = iconMap[task.icon] || Star;

    return (
        <Card className={cn(
            "p-5 flex items-center gap-4 transition-all border group",
            task.completed ? "bg-secondary-container/10 border-secondary/20" : "bg-surface border-transparent shadow-sm hover:shadow-md"
        )}>
            {task.task_type === 'timer' && !task.completed ? (
                <button
                    onClick={onStartTimer}
                    className="w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center transition-all bg-primary text-white shadow-md shadow-primary/30 active:scale-90"
                >
                    <Play size={20} className="ml-0.5" />
                </button>
            ) : (
                <button
                    onClick={onToggle}
                    className={cn(
                        "w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center transition-all active:scale-95",
                        task.completed ? "bg-secondary text-white" : "border-2 border-primary-container text-transparent"
                    )}
                >
                    <CheckCircle2 size={24} />
                </button>
            )}

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <IconComponent size={14} className={cn(task.completed ? "text-secondary" : "text-primary")} />
                    <h4 className={cn(
                        "font-bold truncate text-base",
                        task.completed ? "text-on-surface-variant/60 line-through" : "text-on-surface"
                    )}>
                        {task.title}
                    </h4>
                </div>
                <div className="flex items-center gap-3 mt-1">
                    <span className={cn(
                        "text-xs font-black px-2 py-0.5 rounded-md",
                        task.completed ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
                    )}>
                        +{task.points} PTS
                    </span>
                    {task.task_type === 'timer' && (
                        <span className="text-[10px] font-bold text-on-surface-variant/40 flex items-center gap-1">
                            <Clock size={10} />
                            {task.target_duration} 分钟专注
                        </span>
                    )}
                </div>
            </div>

            {role === 'parent' && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="md:opacity-0 group-hover:opacity-100 p-2 text-on-surface-variant/40 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                >
                    <Trash2 size={18} />
                </button>
            )}
        </Card>
    );
};
