import React, { useEffect, useState } from 'react';
import { useUser } from '@/src/context/UserContext';
import { Card } from '@/src/components/ui/Card';
import { API_URL } from '@/src/api_config';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { cn } from '@/src/lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Star, PlusCircle, BookOpen, Trash2, Moon, PartyPopper, Rocket, Droplets, Puzzle, TreePine, Lock, Coffee, Utensils, Tv, Gamepad2, Bed, Crown, Medal, User, AlertTriangle } from 'lucide-react';

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
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [punishModalConfig, setPunishModalConfig] = useState<{ name: string, amount: number, target: string } | null>(null);
  const [punishReason, setPunishReason] = useState("");
  const [toastMsg, setToastMsg] = useState<{ title: string, type: 'success' | 'error' } | null>(null);

  const showToast = (title: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ title, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchAllData = async () => {
    if (!user) return;
    try {
      const [statsRes, personalRes, achieveRes, leaderRes] = await Promise.all([
        fetch(`${API_URL}/stats/parent?family_id=${user.family_id}`),
        fetch(`${API_URL}/stats/child?family_id=${user.family_id}&username=${user.username}`),
        fetch(`${API_URL}/achievements/child?family_id=${user.family_id}&username=${user.username}`),
        fetch(`${API_URL}/stats/leaderboard?family_id=${user.family_id}`)
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        if (!data.error) setStats(data);
      }
      if (personalRes.ok) {
        const data = await personalRes.json();
        if (!data.error) setPersonalStats(data);
      }
      if (achieveRes.ok) {
        const data = await achieveRes.json();
        if (!data.error) {
          setBadgeCount(data.unlocked_count || 0);
          if (data.badges) {
            setRecentBadges(data.badges.filter((b: any) => b.unlocked).slice(-2));
          }
        }
      }
      if (leaderRes.ok) {
        const data = await leaderRes.json();
        if (Array.isArray(data)) setLeaderboard(data);
      }
    } catch (e) {
      console.error("获取家庭实时数据失败", e);
    }
  };

  useEffect(() => {
    fetchAllData();
    // 开启 5 秒一次的轮询，作为"英雄榜"和其他数据的实时更新机制
    const pollInterval = setInterval(() => {
      fetchAllData();
    }, 5000);
    return () => clearInterval(pollInterval);
  }, [user]);


  const handlePenalize = (penaltyName: string, amount: number) => {
    const childrenList = leaderboard.filter(p => p.role === 'child');
    const targetChild = selectedChild || (childrenList.length > 0 ? childrenList[0].username : null);

    if (!targetChild) return showToast("没有可惩罚的孩子！", "error");

    setPunishModalConfig({ name: penaltyName, amount, target: targetChild });
    setPunishReason("");
  };

  const confirmPenalize = async () => {
    if (!punishModalConfig) return;
    try {
      const res = await fetch(`${API_URL}/users/${punishModalConfig.target}/penalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: user?.family_id,
          penalty_name: punishModalConfig.name,
          amount: punishModalConfig.amount,
          reason: punishReason
        })
      });
      if (res.ok) {
        showToast("🚨 惩罚已生效，积分已被扣除！", "success");
        fetchAllData();
      } else {
        showToast("操作失败！", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("网络错误", "error");
    } finally {
      setPunishModalConfig(null);
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
                {(stats.weekly_data || []).map((entry, index) => (
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
          {!Array.isArray(leaderboard) || leaderboard.length === 0 ? (
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
                  <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">{player.level_title || `等级 ${player.level} 探险家`}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-lg font-black text-primary italic" title="当前可用积分">{player.points}</span>
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


      {/* Punishment Panel */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-red-500" size={24} />
          <h2 className="text-on-primary-container font-black text-xl text-red-600">快捷惩戒中心</h2>
        </div>
        <Card className="p-6 border-red-500/20 bg-red-50/50 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <h3 className="font-bold text-red-900 border-l-4 border-red-500 pl-2">选择处分对象:</h3>
            <div className="flex gap-2 flex-wrap">
              {leaderboard.filter(p => p.role === 'child').length === 0 ? (
                <span className="text-sm text-red-400">目前没有数据...</span>
              ) : (
                leaderboard.filter(p => p.role === 'child').map(child => {
                  const childrenList = leaderboard.filter(c => c.role === 'child');
                  const isSelected = selectedChild === child.username || (!selectedChild && childrenList.length > 0 && childrenList[0].username === child.username);
                  return (
                    <button
                      key={child.username}
                      onClick={() => setSelectedChild(child.username)}
                      className={cn(
                        "px-4 py-2 rounded-full font-bold text-sm transition-all border",
                        isSelected
                          ? "bg-red-500 text-white border-red-500 shadow-md"
                          : "bg-white text-red-500 border-red-200 hover:bg-red-50"
                      )}
                    >
                      <User size={14} className="inline mr-1 -mt-0.5" />
                      {child.username}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { name: '警告', points: 10, bg: 'bg-orange-100 hover:bg-orange-200 border-orange-200', text: 'text-orange-700' },
              { name: '严重警告', points: 30, bg: 'bg-red-100 hover:bg-red-200 border-red-200', text: 'text-red-700' },
              { name: '记小过', points: 50, bg: 'bg-rose-100 hover:bg-rose-200 border-rose-300', text: 'text-rose-800' },
              { name: '记大过', points: 100, bg: 'bg-red-600 hover:bg-red-700 border-red-700 text-white', text: 'text-red-50', whiteText: true }
            ].map(penalty => (
              <button
                key={penalty.name}
                onClick={() => handlePenalize(penalty.name, penalty.points)}
                className={cn(
                  "p-3 rounded-xl border transition-all active:scale-95 flex flex-col items-center justify-center gap-1 group",
                  penalty.bg
                )}
              >
                <span className={cn("font-black text-lg", penalty.whiteText ? "text-white" : penalty.text)}>
                  {penalty.name}
                </span>
                <span className={cn("text-[10px] font-bold opacity-80 uppercase tracking-widest", penalty.text)}>
                  扣 {penalty.points} PTS
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-red-500/70 font-bold italic text-center">
            ⚠️ 注：处分将立即扣除孩子身上已拥有的积分。罚单会自动记录，但不会削弱历史总阅历。
          </p>
        </Card>
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

      {/* Punishment Confirmation Modal */}
      <AnimatePresence>
        {punishModalConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPunishModalConfig(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-surface w-full max-w-sm rounded-[24px] p-8 shadow-2xl relative z-10 border border-outline/10 text-center space-y-6"
            >
              <div className="space-y-4">
                <div className="flex justify-center text-red-500 mb-2">
                  <AlertTriangle size={48} />
                </div>
                <h3 className="text-2xl font-bold text-on-surface tracking-tight">确认触发处分？</h3>
                <p className="text-on-surface-variant leading-relaxed text-sm">
                  你即将对 <strong>{punishModalConfig.target}</strong> 发出<strong className="text-red-500 mx-1">{punishModalConfig.name}</strong>处分，<br />
                  将立即扣除 <strong className="text-red-500">{punishModalConfig.amount}</strong> 积分。
                </p>
                <div className="text-left mt-4 border border-red-500/20 bg-red-50/30 p-4 rounded-xl">
                  <p className="text-xs font-bold text-red-700 uppercase tracking-widest mb-2 pl-2 flex items-center gap-1">
                    处分原因 <span className="text-[10px] bg-red-100 text-red-500 px-1 rounded">必填</span>
                  </p>
                  <Input
                    placeholder="例如：未按时完成作业、对长辈没礼貌..."
                    value={punishReason}
                    onChange={(e) => setPunishReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <Button fullWidth onClick={confirmPenalize} className={cn("border-none text-white", punishReason.trim() ? "bg-red-500 hover:bg-red-600" : "bg-red-300")} disabled={!punishReason.trim()}>
                  确认扣除 {punishModalConfig.amount} 分
                </Button>
                <button onClick={() => setPunishModalConfig(null)} className="w-full py-4 text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors">
                  取消操作
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold text-sm border",
              toastMsg.type === 'success'
                ? "bg-red-50 text-red-600 border-red-200"
                : "bg-surface-container-high text-on-surface border-surface-variant/30"
            )}
          >
            {toastMsg.type === 'success' && <AlertTriangle size={16} />}
            {toastMsg.title}
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
};
