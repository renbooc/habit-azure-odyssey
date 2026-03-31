import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings2, Plus, Trash2, X, Sparkles, CheckCircle2, Play, Star } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { cn } from '@/src/lib/utils';
import { SegmentedControl } from '../ui/SegmentedControl';

interface TemplateManagerModalProps {
    onClose: () => void;
    presets: any[];
    onAdd: () => void;
    onDelete: (id: string) => void;
    newTaskTitle: string;
    onTitleChange: (val: string) => void;
    newTaskPoints: string | number;
    onPointsChange: (val: string) => void;
    newTaskIsDaily: boolean;
    onIsDailyChange: (val: boolean) => void;
    newTaskType: 'checkbox' | 'timer';
    onTypeChange: (val: 'checkbox' | 'timer') => void;
    newTaskDuration: string | number;
    onDurationChange: (val: string) => void;
}

export const TemplateManagerModal = ({
    onClose,
    presets,
    onAdd,
    onDelete,
    newTaskTitle,
    onTitleChange,
    newTaskPoints,
    onPointsChange,
    newTaskIsDaily,
    onIsDailyChange,
    newTaskType,
    onTypeChange,
    newTaskDuration,
    onDurationChange
}: TemplateManagerModalProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="w-full max-w-2xl bg-surface rounded-[2rem] p-8 shadow-2xl relative z-10 space-y-8 flex flex-col md:flex-row gap-8 max-h-[90vh] overflow-hidden"
            >
                <div className="flex-1 space-y-6">
                    <div className="text-left">
                        <h3 className="text-2xl font-black text-on-surface">挑战库管理</h3>
                        <p className="text-on-surface-variant/60">配置你的任务模板，让管理更高效</p>
                    </div>

                    <div className="space-y-4">
                        <Input
                            placeholder="模板名称"
                            value={newTaskTitle}
                            onChange={(e) => onTitleChange(e.target.value)}
                        />

                        <SegmentedControl
                            value={newTaskType}
                            onChange={onTypeChange}
                            activeColor={newTaskType === 'checkbox' ? 'bg-secondary' : 'bg-primary'}
                            options={[
                                { label: '普通挑战', value: 'checkbox', icon: <CheckCircle2 size={14} /> },
                                { label: '专注挑战', value: 'timer', icon: <Play size={14} /> }
                            ]}
                        />

                        {newTaskType === 'timer' && (
                            <div className="relative">
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="专注分钟"
                                    value={newTaskDuration.toString()}
                                    onChange={(e) => onDurationChange(e.target.value)}
                                    className="pr-16"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-primary/60">MIN</span>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest ml-4 mb-1.5">分值</p>
                                <Input
                                    type="number"
                                    value={newTaskPoints.toString()}
                                    onChange={(e) => onPointsChange(e.target.value)}
                                />
                            </div>
                            <div className="flex-1 flex flex-col items-center">
                                <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest mb-1.5">自动派发</p>
                                <button
                                    onClick={() => onIsDailyChange(!newTaskIsDaily)}
                                    className={cn(
                                        "w-full h-10 rounded-xl transition-all font-bold flex items-center justify-center gap-2 border-2",
                                        newTaskIsDaily ? "bg-primary/20 border-primary text-primary shadow-inner" : "bg-surface-container border-outline-variant/30 text-on-surface-variant/40"
                                    )}
                                >
                                    <Sparkles size={16} className={cn(newTaskIsDaily ? "animate-spin-slow" : "")} />
                                    {newTaskIsDaily ? 'DAILY' : 'NORMAL'}
                                </button>
                            </div>
                        </div>

                        <Button onClick={onAdd} disabled={!newTaskTitle} className="w-full py-6 rounded-2xl shadow-xl shadow-primary/20 mt-4">
                            <Plus size={18} className="mr-1" /> 保存至挑战库
                        </Button>
                    </div>
                </div>

                <div className="w-px bg-outline-variant/30 hidden md:block" />

                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">已有模板 ({presets.length})</p>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 no-scrollbar pb-6">
                        {presets.map((p) => (
                            <Card key={p.id} className="p-4 flex items-center justify-between border group shadow-none hover:shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant/60">
                                        <Star size={16} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-on-surface">{p.title}</p>
                                        <div className="flex gap-2 items-center">
                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-primary/10 text-primary">+{p.points} PTS</span>
                                            {p.is_daily && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-600">每日</span>}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onDelete(p.id)}
                                    className="p-2 text-on-surface-variant/40 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </Card>
                        ))}
                    </div>
                </div>

                <button onClick={onClose} className="absolute top-6 right-6 text-on-surface-variant/40 hover:text-on-surface">
                    <X size={24} />
                </button>
            </motion.div>
        </div>
    );
};
