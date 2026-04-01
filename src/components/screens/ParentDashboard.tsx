import React, { useEffect, useState } from 'react';
import { useUser } from '@/src/context/UserContext';
import { Card } from '@/src/components/ui/Card';
import { API_URL } from '@/src/api_config';
import { Button } from '@/src/components/ui/Button';
import { cn } from '@/src/lib/utils';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Star, PlusCircle, BookOpen, Trash2, Moon, PartyPopper, Rocket, Droplets, Puzzle, TreePine, Lock, Coffee, Utensils, Tv, Gamepad2, Bed, Crown, Medal, User } from 'lucide-react';

const iconMap: Record<string, any> = {
  BookOpen, Trash2, Moon, Trophy, Star, Rocket, Droplets, Puzzle, TreePine, Lock, Coffee, Utensils, Tv, Gamepad2, Bed
};

export const ParentDashboard = ({ onNavigate }: { onNavigate?: (screen: string) => void }) => {
  const { user } = useUser();
  const [stats, setStats] = useState({
    completed_tasks: 0,
    completion_rate: 0,
    weekly_data: [
      { name: '周一', value: 0 }, { name: '周二', value: 0 }, { name: '周三', value: 0 },
      { name: '周四', value: 0 }, { name: '周五', value: 0 }, { name: '周六', value: 0 },
      { name: '周日', value: 0 },
    ],
    recent_tasks: [] as any[]
  });

  const [personalStats, setPersonalStats] = useState({
    level: 1,
    streak_days: 1,
    plants_count: 0,
    water_drops: 0,
    points: 0
  });

  const [badgeCount, setBadgeCount] = useState(0);
  const [recentBadges, setRecentBadges] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/stats/parent?family_id=${user?.family_id}`);
        if (res.ok) setStats(await res.json());
      } catch (err) { console.error('获取家长统计数据失败', err); }
    };

    const fetchPersonalStats = async () => {
      try {
        const res = await fetch(`${API_URL}/stats/child?family_id=${user?.family_id}&username=${user?.username}`);
        if (res.ok) setPersonalStats(await res.json());
      } catch (err) { console.error('获取个人统计数据失败', err); }
    };

    const fetchAchievements = async () => {
      try {
        const res = await fetch(`${API_URL}/achievements/child?family_id=${user?.family_id}&username=${user?.username}`);
        if (res.ok) {
          const data = await res.json();
          setBadgeCount(data.unlocked_count || 0);
          if (data.badges) {
            const unlocked = data.badges.filter((b: any) => b.unlocked);
            setRecentBadges(unlocked.slice(-2));
          }
        }
      } catch (err) { console.error('获取成就数据失败', err); }
    };

    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`${API_URL}/stats/leaderboard?family_id=${user?.family_id}`);
        if (res.ok) setLeaderboard(await res.json());
      } catch (err) { console.error('获取排行榜失败', err); }
    };

    fetchStats();
    fetchPersonalStats();
    fetchAchievements();
    fetchLeaderboard();
  }, [user]);

  const uncompleteTask = async (id: string) => {
    if (!window.confirm("确定要将此任务标记为未完成吗？")) return;
    try {
      const res = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: false, family_id: user?.family_id })
      });
      if (res.ok) {
        // Optimistically remove from recent tasks
        setStats(prev => ({
          ...prev,
          recent_tasks: prev.recent_tasks.filter(t => t.id !== id),
          completed_tasks: Math.max(0, prev.completed_tasks - 1)
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Star;
    return <IconComponent size={24} />;
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Personal Progress Stats (Equal Status) */}
      <section className="grid grid-cols-2 gap-4">
        <Card className="p-6 bg-primary/5 border-none shadow-none flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-3">
            <Trophy size={24} />
          </div>
          <p className="text-xs font-black text-primary/60 uppercase tracking-widest mb-1">当前等级</p>
          <h3 className="text-2xl font-black text-on-surface">LV.{personalStats.level}</h3>
        </Card>
        <Card className="p-6 bg-secondary/5 border-none shadow-none flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary mb-3">
            <Star size={24} />
          </div>
          <p className="text-xs font-black text-secondary/60 uppercase tracking-widest mb-1">个人积分</p>
          <h3 className="text-2xl font-black text-on-surface">{personalStats.points}</h3>
        </Card>
      </section>

      {/* Weekly Progress */}
      <Card className="p-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-on-primary-container font-bold text-xl mb-1">全家进度回顾</h2>
            <p className="text-on-surface-variant text-sm text-[#FF8C42] font-black">家庭本周活跃度 {stats.completion_rate}%</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold text-primary">{stats.completed_tasks}</span>
            <span className="text-on-surface-variant text-sm block">全家已完成</span>
          </div>
        </div>

        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.weekly_data}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 600, fill: '#73777b' }}
              />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {stats.weekly_data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 6 ? '#76C893' : (index % 2 === 0 ? '#FFD1B3' : '#FF8C42')}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Badge Achievement */}
      <div className="bg-primary p-8 rounded-xl flex flex-col justify-between text-on-primary shadow-lg overflow-hidden relative">
        <div className="relative z-10">
          <h3 className="font-bold text-lg opacity-90">勋章成就</h3>
          <p className="text-4xl font-extrabold mt-4">{badgeCount}</p>
          <p className="text-sm opacity-70 mt-1">系统已累积解锁</p>
        </div>
        <div className="relative z-10 mt-8 flex -space-x-3">
          {recentBadges.length > 0 ? (
            recentBadges.map((badge, idx) => (
              <div key={idx} className={`w-10 h-10 rounded-full border-2 border-primary ${idx === 0 ? 'bg-secondary-container text-secondary' : 'bg-tertiary-fixed text-on-tertiary-fixed'} flex items-center justify-center`}>
                {renderIcon(badge.icon)}
              </div>
            ))
          ) : (
            <div className="text-sm font-bold opacity-70">等待解锁...</div>
          )}

          {badgeCount > 2 && (
            <div className="w-10 h-10 rounded-full border-2 border-primary bg-white/20 backdrop-blur-md flex items-center justify-center">
              <span className="text-xs font-bold">+{badgeCount - 2}</span>
            </div>
          )}
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary-container/20 rounded-full blur-3xl" />
      </div>

      {/* Family Leaderboard - HERO LIST */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Crown className="text-[#FFD700]" size={24} />
          <h2 className="text-on-primary-container font-black text-xl">全家英雄榜</h2>
        </div>

        <Card className="p-2 bg-surface-container-low border-none space-y-1">
          {leaderboard.length === 0 ? (
            <p className="text-center py-6 text-on-surface-variant/40 text-sm italic font-bold">暂无排名数据...</p>
          ) : leaderboard.map((player, index) => (
            <div
              key={player.username}
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl transition-all",
                player.username === user?.username ? "bg-primary/10 shadow-sm border border-primary/10" : "hover:bg-surface-variant/30"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-black text-sm",
                  index === 0 ? "bg-[#FFD700] text-amber-900 shadow-md shadow-amber-500/20" :
                    index === 1 ? "bg-[#C0C0C0] text-gray-800 shadow-md shadow-gray-400/20" :
                      index === 2 ? "bg-[#CD7F32] text-orange-950 shadow-md shadow-orange-800/20" :
                        "bg-surface-container-high text-on-surface-variant/40"
                )}>
                  {index + 1}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-on-surface tracking-tight">{player.username}</span>
                    {player.role === 'parent' && <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded font-black">家长</span>}
                  </div>
                  <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">等级 {player.level} 探险家</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-lg font-black text-primary italic">{player.points}</span>
                  <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase">pts</span>
                </div>
                <div className="w-16 h-1 bg-surface-container-high rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.min(100, (player.points / (leaderboard[0]?.points || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </Card>
      </section>

      {/* Task List */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-on-primary-container font-bold text-xl">最近完成的任务</h2>
          <button onClick={() => onNavigate && onNavigate('tasks')} className="text-primary font-bold text-sm flex items-center gap-1 hover:opacity-80">
            <BookOpen size={18} />
            任务管理
          </button>
        </div>
        <div className="space-y-4">
          {stats.recent_tasks.length === 0 ? (
            <p className="text-center text-on-surface-variant/60 py-4">暂无已完成的任务</p>
          ) : stats.recent_tasks.map((task, i) => (
            <Card key={i} className={`p-6 flex items-center justify-between border-l-4 border-primary`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary`}>
                  {renderIcon(task.icon)}
                </div>
                <div>
                  <h4 className="font-bold text-on-surface">{task.title}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-on-surface-variant/60 font-black uppercase tracking-tight">奖励：{task.points} 积分</p>
                    {task.username && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded font-black flex items-center gap-0.5">
                        <User size={8} /> {task.username}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div
                onClick={() => uncompleteTask(task.id)}
                className={`w-14 h-8 rounded-full p-1 transition-all cursor-pointer bg-primary hover:bg-red-500`}
                title="撤销完成状态"
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-all translate-x-6`} />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Set New Reward / Store Management CTA */}
      <Card className="p-8 primary-gradient text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute -right-10 -bottom-10 opacity-20 transform rotate-12">
          <PartyPopper size={160} />
        </div>
        <div className="relative z-10 space-y-2 flex-grow">
          <h2 className="font-black text-2xl flex items-center gap-2">
            发现更多惊喜奖励！
          </h2>
          <p className="text-on-primary/90 text-sm md:text-base max-w-sm">
            你可以前往积分商城，为孩子配置全新的定制奖励，例如“去游乐园”、“免写作业一次”等极具吸引力的奖品。
          </p>
        </div>
        <div className="relative z-10 w-full md:w-auto">
          <Button
            onClick={() => onNavigate && onNavigate('store')}
            className="w-full md:w-auto bg-white text-primary hover:bg-white/90 font-bold whitespace-nowrap shadow-xl py-6 px-8 rounded-full text-lg"
          >
            前往商城管理 🚀
          </Button>
        </div>
      </Card>
    </div >
  );
};
