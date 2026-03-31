import React, { useState, useEffect } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Rocket, Moon, Lock, Droplets, BookOpen, Brain, TreePine, Zap, BadgeCheck, Gift, CheckCircle, Clock, Star, Puzzle } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const iconMap: Record<string, any> = {
  Rocket, Moon, Lock, Droplets, BookOpen, Brain, TreePine, Zap, Star, Puzzle
};

export const Achievements = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeBadge, setActiveBadge] = useState<any>(null);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const res = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/achievements/child`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setActiveBadge(json.badges.find((b: any) => b.active) || json.badges.find((b: any) => b.unlocked) || json.badges[0]);
        }
      } catch (err) {
        console.error('获取成就数据失败', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-on-surface-variant font-bold">获取徽章数据中...</div>;
  }

  // Fallback if data fails
  const achievements = data || {
    unlocked_count: 0,
    total_badges: 8,
    progress_percent: 0,
    badges: []
  };
  return (
    <div className="space-y-8 pb-32">
      {/* Master Explorer Header */}
      <section className="text-center relative overflow-hidden primary-gradient p-8 rounded-xl text-white">
        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold tracking-tight mb-2">探险大师</h2>
          <p className="text-on-primary/80 font-medium">你已经发现了 {achievements.total_badges} 个星际秘密中的 {achievements.unlocked_count} 个！</p>
          <div className="mt-6 flex justify-center items-center gap-4">
            <div className="h-3 w-48 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full shadow-[0_0_10px_#76C893] transition-all duration-1000 ease-out"
                style={{ width: `${achievements.progress_percent}%` }}
              />
            </div>
            <span className="font-bold">{achievements.progress_percent}% 已完成</span>
          </div>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl" />
      </section>

      {/* Badge Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {achievements.badges.map((badge: any, i: number) => {
          const IconComponent = iconMap[badge.icon] || Lock;
          return (
            <div
              key={i}
              onClick={() => setActiveBadge(badge)}
              className={cn(
                'relative p-6 rounded-lg text-center transition-all cursor-pointer',
                activeBadge?.id === badge.id ? 'bg-surface border-4 border-primary shadow-xl ring-4 ring-primary-container/20' : 'bg-surface shadow-sm hover:scale-105',
                !badge.unlocked && 'bg-surface-container-low opacity-60'
              )}
            >
              <div className={cn(
                'mx-auto w-20 h-20 mb-4 rounded-full flex items-center justify-center',
                badge.unlocked ? 'primary-gradient shadow-lg shadow-primary/30' : 'bg-surface-container-high border-2 border-dashed border-outline-variant'
              )}>
                <IconComponent size={40} className={cn(badge.unlocked ? 'text-white fill-current' : 'text-on-surface-variant/40')} />
              </div>
              <h3 className="font-bold text-on-surface">{badge.title}</h3>
              <p className="text-xs text-on-surface-variant/60 mt-1">{badge.sub}</p>
              {badge.unlocked && activeBadge?.id !== badge.id && (
                <div className="absolute top-2 right-2 text-secondary">
                  <BadgeCheck size={18} className="fill-current" />
                </div>
              )}
              {activeBadge?.id === badge.id && (
                <div className="absolute -top-2 -right-2 bg-primary text-white text-[10px] px-2 py-1 rounded-full font-bold">已选择</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detailed View */}
      {activeBadge && (() => {
        const ActiveIcon = iconMap[activeBadge.icon] || Lock;
        return (
          <Card className="p-8 border border-primary/10 transition-all">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className={cn(
                "w-32 h-32 flex-shrink-0 rounded-full flex items-center justify-center shadow-2xl relative",
                activeBadge.unlocked ? "bg-gradient-to-br from-primary to-secondary-container" : "bg-surface-container-high border-2 border-dashed border-outline-variant"
              )}>
                <ActiveIcon size={60} className={activeBadge.unlocked ? "text-white fill-current" : "text-on-surface-variant/40"} />
                {activeBadge.unlocked && (
                  <div className="absolute -bottom-2 bg-white px-3 py-1 rounded-full shadow-md">
                    <span className="text-primary font-bold text-sm">+500 XP</span>
                  </div>
                )}
              </div>
              <div className="flex-grow text-center md:text-left space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-extrabold text-on-surface pb-1">{activeBadge.title}</h2>
                    {activeBadge.unlocked ? (
                      <p className="text-on-surface-variant/80 font-medium">获得日期：{activeBadge.earned_at}</p>
                    ) : (
                      <p className="text-on-surface-variant/60 font-medium flex items-center gap-1 justify-center md:justify-start">
                        <Lock size={14} /> 尚未解锁
                      </p>
                    )}
                  </div>
                  {activeBadge.unlocked && (
                    <div className="bg-secondary-container px-6 py-2 rounded-full inline-flex items-center gap-2">
                      <Gift size={20} className="text-secondary" />
                      <span className="font-bold text-secondary">奖励已发放</span>
                    </div>
                  )}
                </div>
                <p className="text-on-surface leading-relaxed">
                  {activeBadge.unlocked
                    ? `太棒了，你已经成功达成了「${activeBadge.title}」的成就条件！继续保持！`
                    : `再加把劲！只要完成【${activeBadge.sub}】条件，就能点亮这款徽章啦。`}
                </p>
              </div>
            </div>
          </Card>
        );
      })()}
    </div>
  );
};
