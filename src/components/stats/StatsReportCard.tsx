import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import { motion } from 'motion/react';
import { Card } from '@/src/components/ui/Card';
import { Download, Share2, Award, Zap, Target, Star, Ship } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface StatsReportCardProps {
    user: any;
    data: any;
    view: 'weekly' | 'monthly';
    onClose: () => void;
}

export const StatsReportCard = ({ user, data, view, onClose }: StatsReportCardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        try {
            const dataUrl = await toPng(cardRef.current, { cacheBust: true, quality: 1, pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = `AzureOdyssey-${view}-Report-${user.username}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to generate image', err);
        }
    };

    const totalTasks = data.reduce((acc: number, curr: any) => acc + curr.count, 0);
    const totalPoints = data.reduce((acc: number, curr: any) => acc + (curr.points || 0), 0);
    const timeLabel = view === 'weekly' ? '本周' : '本月';

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-md w-full animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="text-white font-black text-xl flex items-center gap-2">
                        <Share2 size={20} /> 生成成就海报
                    </h3>
                    <button onClick={onClose} className="text-white/60 hover:text-white font-bold text-sm">取消</button>
                </div>

                {/* The Card to be Captured */}
                <div ref={cardRef} className="rounded-[2.5rem] overflow-hidden bg-surface shadow-2xl relative aspect-[3/4] w-full">
                    {/* Background Art */}
                    <div className="absolute inset-0 primary-gradient opacity-10" />
                    <div className="absolute top-0 left-0 right-0 h-48 bg-primary/10 rounded-b-[3rem] -z-0" />

                    {/* Header Decoration */}
                    <div className="absolute top-6 right-8 text-primary/20">
                        <Ship size={120} />
                    </div>

                    <div className="relative z-10 p-10 h-full flex flex-col">
                        {/* User Info */}
                        <div className="flex items-center gap-4 mb-10 text-left">
                            <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center text-white shadow-lg overflow-hidden border-4 border-white">
                                {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <Star size={32} />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-on-surface tracking-tight">{user.username}</h2>
                                <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">{timeLabel}习惯探险报告</p>
                            </div>
                        </div>

                        {/* Achievement Badge */}
                        <div className="flex-grow flex flex-col items-center justify-center py-6">
                            <div className="w-32 h-32 rounded-full bg-primary/5 flex items-center justify-center relative mb-6">
                                <div className="absolute inset-0 animate-pulse bg-primary/10 rounded-full" />
                                <Award size={80} className="text-primary relative z-10" />
                            </div>
                            <h3 className="text-3xl font-black text-on-surface mb-2">
                                {totalTasks > 10 ? (view === 'weekly' ? '深海领航者' : '极境开拓者') : '勤勉探险家'}
                            </h3>
                            <div className="h-1 w-12 bg-primary rounded-full mb-8" />
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-10">
                            <div className="bg-surface-container-low p-5 rounded-3xl border border-outline/5">
                                <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Target size={12} className="text-primary" /> 达成挑战
                                </p>
                                <h4 className="text-2xl font-black text-on-surface italic">{totalTasks} <span className="text-sm not-italic opacity-40 ml-1">项</span></h4>
                            </div>
                            <div className="bg-surface-container-low p-5 rounded-3xl border border-outline/5">
                                <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Zap size={12} className="text-secondary" /> 获取积分
                                </p>
                                <h4 className="text-2xl font-black text-on-surface italic">+{totalPoints}</h4>
                            </div>
                        </div>

                        {/* Footer Branding */}
                        <div className="flex items-center justify-between border-t border-outline/10 pt-8 mt-auto">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                                    <Ship size={14} className="text-white" />
                                </div>
                                <span className="text-xs font-black text-on-surface tracking-tighter uppercase italic">Azure Odyssey</span>
                            </div>
                            <p className="text-[10px] font-bold text-on-surface-variant/30">
                                {new Date().toLocaleDateString()} · 习惯见证成长
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-8 flex gap-3">
                    <button
                        onClick={handleDownload}
                        className="flex-1 primary-gradient text-white py-4 rounded-full font-black flex items-center justify-center gap-2 shadow-xl shadow-primary/20 active:scale-95 transition-all"
                    >
                        <Download size={20} /> 下载并保存到相册
                    </button>
                </div>
                <p className="text-center text-white/40 text-[10px] font-bold uppercase tracking-widest mt-4">
                    快分享你的荣耀时刻吧！
                </p>
            </div>
        </div>
    );
};
