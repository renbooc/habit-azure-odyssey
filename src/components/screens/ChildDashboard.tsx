import React, { useEffect, useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { API_URL } from '@/src/api_config';
import { Flame, Droplets, Leaf, Check, Bed, BookOpen, Puzzle, Palette, Play, Pause, X, CheckCircle2, Circle, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import confetti from 'canvas-confetti';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useUser } from '@/src/context/UserContext';
import { TrendCards } from '../stats/TrendCards';

export const ChildDashboard = ({ onSelectTask }: { onSelectTask: (taskId: string) => void }) => {
  const { user, refreshPoints } = useUser();
  const [stats, setStats] = useState<any>({
    level: 1,
    streak_days: 0,
    plants_count: 0,
    water_drops: 0,
    points: 0,
    quick_tasks: []
  });
  const [history, setHistory] = useState<any[]>([]);
  const [activeTimer, setActiveTimer] = useState<{ id: string, title: string, remaining: number, isPaused: boolean } | null>(null);
  const [quote, setQuote] = useState<string | null>(null);
  const [bgImage, setBgImage] = useState<string>("https://picsum.photos/seed/ocean-default/800/450");

  const HERO_SEEDS = [
    'ocean', 'sea', 'beach', 'boat', 'water', 'reef', 'underwater', 'sunset-sea', 'island', 'sail'
  ];

  const QUOTES = [
    "你今天的能量值爆表，像深海巨鲸一样无可阻挡！🐋",
    "深蓝海洋见证了你的每一份努力，继续加油！🌊",
    "你是这片海域最勤奋的探险家，宝藏就在前方！💎",
    "像潮汐一样持之以恒，终将汇聚成伟大的力量！🛶",
    "你的光芒正在照亮最深邃的海沟，太棒了！✨",
    "海浪虽然起伏，但坚定的船长从不返航，冲鸭！🚢",
    "由于你的坚持，这片海洋花园正在悄悄绽放！🌿",
    "每一次打卡，都是在为你的梦想海洋注入淡水！💧"
  ];

  const showRandomQuote = () => {
    const randomIdx = Math.floor(Math.random() * QUOTES.length);
    setQuote(QUOTES[randomIdx]);
    setTimeout(() => setQuote(null), 3000);
  };

  useEffect(() => {
    // 随机选择背景图
    const randomSeed = HERO_SEEDS[Math.floor(Math.random() * HERO_SEEDS.length)];
    setBgImage(`https://picsum.photos/seed/${randomSeed}/800/450`);

    // 默认展示一句鼓励语
    const timer = setTimeout(showRandomQuote, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const safeFamilyId = encodeURIComponent(user?.family_id || '');
    const safeUsername = encodeURIComponent(user?.username || '');
    const ts = Date.now();
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/stats/child?family_id=${safeFamilyId}&username=${safeUsername}&_t=${ts}`, { headers: { 'Cache-Control': 'no-cache' } });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('获取孩子统计数据失败', err);
      }
    };
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/stats/history?family_id=${safeFamilyId}&username=${safeUsername}&_t=${ts}`, { headers: { 'Cache-Control': 'no-cache' } });
        if (res.ok) {
          const data = await res.json();
          // 确保返回的是数组
          if (Array.isArray(data)) {
            setHistory(data);
          } else {
            console.warn('History API returned non-array:', data);
          }
        }
      } catch (err) {
        console.error('获取历史统计数据失败', err);
      }
    };
    fetchStats();
    fetchHistory();
  }, [user?.username]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22d3ee', '#818cf8', '#f472b6']
    });
  };

  useEffect(() => {
    if (!activeTimer || activeTimer.isPaused) return;
    const timer = setInterval(() => {
      setActiveTimer(prev => {
        if (!prev) return null;
        if (prev.remaining <= 0) return prev;
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTimer?.isPaused, activeTimer?.id]);

  useEffect(() => {
    if (activeTimer && activeTimer.remaining === 0) {
      handleToggleTask(activeTimer.id);
      setActiveTimer(null);
    }
  }, [activeTimer?.remaining]);

  const handleToggleTask = async (taskId: string) => {
    try {
      const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true, family_id: user?.family_id })
      });
      if (res.ok) {
        triggerConfetti();
        refreshPoints();
        const taskObj = stats.quick_tasks.find((t: any) => t.id === taskId);
        const earned = taskObj?.points || 10;
        // Refresh local state to remove completed task
        setStats((prev: any) => ({
          ...prev,
          quick_tasks: prev.quick_tasks.filter((t: any) => t.id !== taskId),
          points: prev.points + earned,
          water_drops: prev.water_drops + earned
        }));
      }
    } catch (err) {
      console.error('Failed to update task', err);
    }
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Immersive Timer Modal */}
      <AnimatePresence>
        {activeTimer && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center text-white p-6"
          >
            <button onClick={() => setActiveTimer(null)} className="absolute top-8 left-8 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              <X size={24} />
            </button>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center">
              <p className="text-white/60 text-lg font-bold tracking-widest uppercase mb-4">专注进行中</p>
              <h2 className="text-3xl font-black mb-12 max-w-[80vw] text-center leading-snug">{activeTimer.title}</h2>
              <div className="relative w-64 h-64 flex items-center justify-center mb-16">
                <div className="text-8xl font-black tabular-nums tracking-tighter shadow-white/10">
                  {Math.floor(activeTimer.remaining / 60).toString().padStart(2, '0')}:{(activeTimer.remaining % 60).toString().padStart(2, '0')}
                </div>
              </div>
              <button
                onClick={() => setActiveTimer({ ...activeTimer, isPaused: !activeTimer.isPaused })}
                className={cn("w-24 h-24 rounded-full flex items-center justify-center transition-all", activeTimer.isPaused ? "bg-primary text-white scale-110 shadow-lg shadow-primary/50" : "bg-white/20 text-white")}
              >
                {activeTimer.isPaused ? <Play size={40} className="ml-2" /> : <Pause size={40} />}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative aspect-video rounded-xl overflow-hidden shadow-ambient bg-primary-container/10 group">
        <motion.img
          key={bgImage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          src={bgImage}
          alt="Ocean Odyssey"
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end text-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-secondary rounded-full text-[10px] font-bold tracking-widest uppercase">
                {stats.level_emoji} 等级 {stats.level}
              </span>
              <div className="flex items-center text-secondary-container">
                <Flame size={14} className="fill-current" />
                <span className="text-xs font-bold">{stats.streak_days} 天连击</span>
              </div>
            </div>
            <p className="text-2xl font-bold">{stats.level_title || '天空探险家'}</p>
          </div>
          <div className="flex flex-col items-center gap-2 relative">
            <AnimatePresence>
              {quote && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: -70, scale: 1 }}
                  exit={{ opacity: 0, y: -110, scale: 0.8 }}
                  className="absolute z-50 bg-black/80 backdrop-blur-2xl text-white p-4 rounded-3xl shadow-2xl border border-white/20 w-56 right-0 origin-bottom-right"
                >
                  <p className="text-[12px] font-black leading-snug drop-shadow-sm italic">“ {quote} ”</p>
                  <div className="absolute -bottom-2 right-5 w-4 h-4 bg-black/80 rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={showRandomQuote}
              className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer shadow-lg active:bg-white/40"
            >
              <Droplets size={30} className="fill-white" />
            </motion.div>
            <span className="text-[10px] font-bold">成长点滴</span>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="flex flex-col items-center text-center p-6">
          <div className="w-12 h-12 rounded-full bg-secondary-container/30 flex items-center justify-center mb-3">
            <Leaf size={24} className="text-secondary fill-current" />
          </div>
          <span className="text-[12px] font-semibold text-on-surface-variant/60 mb-1">已种植物</span>
          <span className="text-2xl font-bold text-on-surface">{stats.plants_count}</span>
        </Card>
        <Card className="flex flex-col items-center text-center p-6">
          <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center mb-3">
            <Droplets size={24} className="text-primary fill-current" />
          </div>
          <span className="text-[12px] font-semibold text-on-surface-variant/60 mb-1">水滴数 / 积分</span>
          <span className="text-2xl font-bold text-on-surface">{stats.water_drops}</span>
        </Card>
      </div>

      {/* Enhanced Growth Trends */}
      <TrendCards
        familyId={user?.family_id || ''}
        username={user?.username}
        title="我的成长轨迹"
      />

      {/* Quick Actions */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-on-surface px-2">快速开始</h2>
        <div className="grid grid-cols-2 gap-4">
          {stats.quick_tasks && stats.quick_tasks.length > 0 ? (
            stats.quick_tasks.map((task: any, i: number) => {
              const icons = {
                'BookOpen': BookOpen,
                'Bed': Bed,
                'Check': Check,
                'Puzzle': Puzzle,
                'Leaf': Leaf,
                'Droplets': Droplets
              } as const;
              const IconComponent = icons[task.icon as keyof typeof icons] || Check;
              return (
                <Card
                  key={task.id || i}
                  className="p-6 bg-secondary-container/20 border border-secondary/10 flex flex-col items-center gap-3 relative group"
                >
                  <div className="w-12 h-12 rounded-full bg-secondary text-white flex items-center justify-center relative overflow-hidden">
                    {task.task_type === 'timer' ? (
                      <button
                        onClick={() => setActiveTimer({ id: task.id, title: task.title, remaining: (task.target_duration || 30) * 60, isPaused: false })}
                        className="absolute inset-0 bg-primary flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        <Play size={24} className="ml-1" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className="absolute inset-0 bg-secondary flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        <IconComponent size={24} />
                      </button>
                    )}
                  </div>
                  <span className="font-bold text-sm text-center line-clamp-1" title={task.title}>{task.title}</span>
                  {task.task_type === 'timer' && (
                    <span className="text-[10px] font-black text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">
                      ⏱️ {task.target_duration} MIN
                    </span>
                  )}
                </Card>
              );
            })
          ) : (
            <div className="col-span-2 text-center text-on-surface-variant/60 py-4 text-sm bg-surface-container-low rounded-xl">
              太棒了！你目前没有未完成的任务 🎉
            </div>
          )}
        </div>
      </section>

      {/* Streak Celebration */}
      <section className="primary-gradient p-6 rounded-xl shadow-lg shadow-primary/20 text-white relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-6">
          <div className="flex-shrink-0 w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30 shadow-inner">
            <span className="text-4xl drop-shadow-md">🔥</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold leading-tight drop-shadow-sm">你太棒了！</h2>
            <p className="text-white/90 text-sm mt-1">
              {stats.streak_days > 0
                ? `连续 ${stats.streak_days} 天坚持好习惯。继续加油！`
                : '今天是培养好习惯的第一天，开始行动吧！'}
            </p>

            {/* Visual Progress Bar */}
            <div className="mt-4 space-y-2">
              <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-white/10 shadow-inner">
                <div
                  className="bg-white h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                  style={{ width: `${Math.min(100, (stats.streak_days / (Math.ceil((stats.streak_days + 0.1) / 7) * 7 || 7)) * 100)}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                </div>
              </div>
              <div className="flex justify-between text-xs font-bold text-white/90 px-1">
                <span>当前: {stats.streak_days} 天</span>
                <span>目标: {Math.ceil((stats.streak_days + 0.1) / 7) * 7 || 7} 天</span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-secondary/30 rounded-full blur-2xl pointer-events-none" />
      </section>
    </div>
  );
};
