import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { API_URL } from '@/src/api_config';
import { Card } from '@/src/components/ui/Card';
import { Calendar, TrendingUp, Star, CheckCircle, Share2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { StatsReportCard } from './StatsReportCard';
import { useUser } from '@/src/context/UserContext';

interface TrendData {
    name: string;
    count: number;
    points: number;
}

interface TrendCardsProps {
    familyId: string;
    username?: string;
    title?: string;
}

export const TrendCards = ({ familyId, username, title = "习惯养成趋势" }: TrendCardsProps) => {
    const { user } = useUser();
    const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [data, setData] = useState<TrendData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            let endpoint = '';
            if (view === 'daily') endpoint = `/stats/history?family_id=${familyId}&username=${username || ''}`;
            else if (view === 'weekly') endpoint = `/stats/history/weeks?family_id=${familyId}&username=${username || ''}`;
            else if (view === 'monthly') endpoint = `/stats/history/months?family_id=${familyId}&username=${username || ''}`;

            const res = await fetch(`${API_URL}${endpoint}`);
            if (res.ok) {
                const result = await res.json();
                // 容错处理：区分数组结果与报错对象
                if (Array.isArray(result)) {
                    const normalized = result.map((item: any) => ({
                        name: item.name || item.date || '未知',
                        count: item.count || 0,
                        points: item.points || item.minutes || 0
                    }));
                    setData(normalized);
                } else if (result && result.error) {
                    console.error('API Error:', result.error);
                }
            } else {
                console.error('Fetch failed with status:', res.status);
            }
        } catch (e) {
            console.error('TrendCards Fetch Error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [view, familyId, username]);

    const totalCount = data.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <Card className="p-0 overflow-hidden border-none shadow-ambient bg-surface">
            <div className="p-6 pb-2">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <TrendingUp size={20} />
                        </div>
                        <h3 className="text-lg font-black text-on-surface tracking-tight">{title}</h3>
                    </div>

                    <div className="flex bg-surface-container-high p-1 rounded-full">
                        {(['daily', 'weekly', 'monthly'] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                                    view === v
                                        ? "bg-primary text-white shadow-sm"
                                        : "text-on-surface-variant/60 hover:text-on-surface"
                                )}
                            >
                                {v === 'daily' ? '日' : v === 'weekly' ? '周' : '月'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-surface-container-low p-4 rounded-2xl border border-outline/5 relative group overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest mb-1 flex items-center gap-1">
                                <CheckCircle size={10} /> 累计完成
                            </p>
                            <h4 className="text-2xl font-black text-on-surface italic">{totalCount} <span className="text-sm not-italic opacity-40 ml-1">项</span></h4>
                        </div>

                        {(view === 'weekly' || view === 'monthly') && !loading && totalCount > 0 && (
                            <button
                                onClick={() => setIsGenerating(true)}
                                className="absolute right-2 bottom-2 p-2 bg-primary text-white rounded-full shadow-lg transform translate-y-12 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-1 text-[10px] font-bold pr-3"
                            >
                                <Share2 size={12} className="ml-0.5" />
                                生成海报
                            </button>
                        )}
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-2xl border border-outline/5">
                        <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Calendar size={10} /> 统计周期
                        </p>
                        <h4 className="text-base font-black text-on-surface">
                            {view === 'daily' ? '最近7天' : view === 'weekly' ? '最近4周' : '最近6个月'}
                        </h4>
                    </div>
                </div>
            </div>

            {/* Modal for Card Generation */}
            {isGenerating && user && (view === 'weekly' || view === 'monthly') && (
                <StatsReportCard
                    user={user}
                    data={data}
                    view={view}
                    onClose={() => setIsGenerating(false)}
                />
            )}

            <div className="h-64 w-full px-2">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-2 opacity-40">
                        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <span className="text-xs font-bold">计算中...</span>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                                dy={10}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                cursor={{ stroke: '#6366F1', strokeWidth: 2 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#6366F1"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorCount)"
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
            <div className="p-4 bg-surface-container-low/50 text-center">
                <p className="text-[10px] font-bold text-on-surface-variant/40 flex items-center justify-center gap-1 italic">
                    <Star size={10} /> 持续记录，见证每一天的成长之旅
                </p>
            </div>
        </Card>
    );
};
