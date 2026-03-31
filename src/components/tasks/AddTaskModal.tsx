import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Play, Star, Clock, Puzzle, Palette, Settings2, Plus, Sparkles, X, Gift } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { cn } from '@/src/lib/utils';
import { SegmentedControl } from '../ui/SegmentedControl';

interface AddTaskModalProps {
    role: string | undefined;
    searchTerm: string;
    onSearchChange: (val: string) => void;
    newTaskTitle: string;
    onTitleChange: (val: string) => void;
    newTaskPoints: string | number;
    onPointsChange: (val: string) => void;
    newTaskIcon: string;
    onIconChange: (val: string) => void;
    newTaskType: 'checkbox' | 'timer';
    onTypeChange: (val: 'checkbox' | 'timer') => void;
    newTaskDuration: string | number;
    onDurationChange: (val: string) => void;
    newTaskIsDaily: boolean;
    onIsDailyChange: (val: boolean) => void;
    onClose: () => void;
    onAdd: (preset?: any) => void;
    presets: any[];
}

export const AddTaskModal = ({
    role,
    searchTerm,
    onSearchChange,
    newTaskTitle,
    onTitleChange,
    newTaskPoints,
    onPointsChange,
    newTaskIcon,
    onIconChange,
    newTaskType,
    onTypeChange,
    newTaskDuration,
    onDurationChange,
    newTaskIsDaily,
    onIsDailyChange,
    onClose,
    onAdd,
    presets
}: AddTaskModalProps) => {
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
                className="w-full max-w-md bg-surface rounded-[2rem] p-8 shadow-2xl relative z-10 space-y-8 overflow-hidden"
            >
                <div className="text-center">
                    <h3 className="text-2xl font-black text-on-surface">
                        {role === 'child' ? '接受新挑战' : '新任务配置'}
                    </h3>
                    <p className="text-on-surface-variant/60 font-medium tracking-wide">
                        {role === 'child' ? '从任务库中挑选一个目标去完成吧！' : '你想添加什么任务？'}
                    </p>
                </div>

                <div className="space-y-6">
                    {role === 'child' ? (
                        <div className="space-y-4">
                            <Input
                                placeholder="搜索挑战任务..."
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 no-scrollbar">
                                {presets.length === 0 ? (
                                    <p className="text-center text-xs text-on-surface-variant/40 py-10">没有找到匹配的挑战</p>
                                ) : (
                                    presets.map((p) => (
                                        <Card
                                            key={p.id}
                                            onClick={() => onAdd(p)}
                                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-primary/5 hover:border-primary/20 transition-all border group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                    <Plus size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-on-surface">{p.title}</p>
                                                    <p className="text-[10px] text-primary/70 font-black">+{p.points} PTS</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-on-surface-variant/40 flex items-center gap-1">
                                                立即领取挑战
                                                <CheckCircle2 size={12} />
                                            </span>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <Input
                                    placeholder="输入自定义任务名称..."
                                    value={newTaskTitle}
                                    onChange={(e) => onTitleChange(e.target.value)}
                                />

                                <SegmentedControl
                                    value={newTaskType}
                                    onChange={onTypeChange}
                                    activeColor={newTaskType === 'checkbox' ? 'bg-secondary' : 'bg-primary'}
                                    options={[
                                        { label: '普通打卡', value: 'checkbox', icon: <CheckCircle2 size={14} /> },
                                        { label: '专注计时', value: 'timer', icon: <Play size={14} /> }
                                    ]}
                                />

                                <AnimatePresence mode="wait">
                                    {newTaskType === 'timer' && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                            <div className="relative">
                                                <Input
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    placeholder="专注时长"
                                                    value={newTaskDuration.toString()}
                                                    onChange={(e) => onDurationChange(e.target.value)}
                                                    className="pl-4 pr-16"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-primary/60">分钟</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest ml-4 mb-1.5 text-center">奖励积分</p>
                                        <Input
                                            type="number"
                                            placeholder="价格"
                                            value={newTaskPoints.toString()}
                                            onChange={(e) => onPointsChange(e.target.value)}
                                            className="text-center"
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col items-center">
                                        <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest mb-1.5">设为每日任务</p>
                                        <button
                                            onClick={() => onIsDailyChange(!newTaskIsDaily)}
                                            className={cn(
                                                "w-full h-10 rounded-xl transition-all font-bold flex items-center justify-center gap-2 border-2",
                                                newTaskIsDaily ? "bg-primary/20 border-primary text-primary shadow-inner" : "bg-surface-container border-outline-variant/30 text-on-surface-variant/40"
                                            )}
                                        >
                                            <Sparkles size={16} className={cn(newTaskIsDaily ? "animate-spin-slow" : "")} />
                                            {newTaskIsDaily ? '是' : '否'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={onClose} className="flex-1 py-6 rounded-2xl">取消</Button>
                                <Button onClick={onAdd} disabled={!newTaskTitle} className="flex-1 py-6 rounded-2xl shadow-xl shadow-primary/20">
                                    <Plus size={18} className="mr-1" /> 保存并发起
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
