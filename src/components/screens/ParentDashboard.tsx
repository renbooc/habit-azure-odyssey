import React, { useEffect, useState } from "react";
import { useUser } from "@/src/context/UserContext";
import { Card } from "@/src/components/ui/Card";
import { API_URL } from "@/src/api_config";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { cn } from "@/src/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Trophy,
  Star,
  PlusCircle,
  BookOpen,
  Trash2,
  Moon,
  PartyPopper,
  Rocket,
  Droplets,
  Puzzle,
  TreePine,
  Lock,
  Coffee,
  Utensils,
  Tv,
  Gamepad2,
  Bed,
  Crown,
  Medal,
  User,
  AlertTriangle,
  Shield,
  ThumbsUp,
  ThumbsDown,
  KeyRound,
  CheckCircle,
} from "lucide-react";
import { TrendCards } from "../stats/TrendCards";
import { TrustScoreCard } from "@/src/components/trust/TrustScoreCard";
import { TrustHistoryModal } from "@/src/components/trust/TrustHistoryModal";
import { useTrust } from "@/src/context/TrustContext";

const iconMap: Record<string, any> = {
  BookOpen,
  Trash2,
  Moon,
  Trophy,
  Star,
  Rocket,
  Droplets,
  Puzzle,
  TreePine,
  Lock,
  Coffee,
  Utensils,
  Tv,
  Gamepad2,
  Bed,
};

export const ParentDashboard = ({
  onNavigate,
}: {
  onNavigate?: (screen: string) => void;
}) => {
  const { user, refreshPoints } = useUser();
  const [stats, setStats] = useState({
    completed_tasks: 0,
    completion_rate: 0,
    weekly_data: [
      { name: "周一" },
      { name: "周二" },
      { name: "周三" },
      { name: "周四" },
      { name: "周五" },
      { name: "周六" },
      { name: "周日" },
    ],
    active_members: [] as string[],
    recent_tasks: [] as any[],
  });

  const [personalStats, setPersonalStats] = useState({
    level: 1,
    streak_days: 1,
    plants_count: 0,
    water_drops: 0,
    points: 0,
  });

  const [familyTrustData, setFamilyTrustData] = useState<any[]>([]);
  const [badgeCount, setBadgeCount] = useState(0);
  const [recentBadges, setRecentBadges] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [trustSelectedChild, setTrustSelectedChild] = useState<string>("");
  const [trustAdjustDelta, setTrustAdjustDelta] = useState<string>("");
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [punishModalConfig, setPunishModalConfig] = useState<{
    name: string;
    amount: number;
    target: string;
  } | null>(null);
  const [punishReason, setPunishReason] = useState("");
  const [toastMsg, setToastMsg] = useState<{
    title: string;
    type: "success" | "error";
  } | null>(null);
  const [pendingResets, setPendingResets] = useState<any[]>([]);
  const [showResetCode, setShowResetCode] = useState<string | null>(null);

  const showToast = (title: string, type: "success" | "error" = "success") => {
    setToastMsg({ title, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchAllData = async () => {
    if (!user) return;
    try {
      const [statsRes, personalRes, achieveRes, leaderRes] = await Promise.all([
        fetch(`${API_URL}/stats/parent?family_id=${user.family_id}`),
        fetch(
          `${API_URL}/stats/child?family_id=${user.family_id}&username=${user.username}`,
        ),
        fetch(
          `${API_URL}/achievements/child?family_id=${user.family_id}&username=${user.username}`,
        ),
        fetch(`${API_URL}/stats/leaderboard?family_id=${user.family_id}`),
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
            setRecentBadges(
              data.badges.filter((b: any) => b.unlocked).slice(-2),
            );
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

  // ── 信任指数管理 ──
  const { updateTrustScore } = useTrust();
  const [showTrustModal, setShowTrustModal] = useState(false);
  const [trustAdjustConfig, setTrustAdjustConfig] = useState<{
    username: string;
    delta: number;
    reason: string;
  } | null>(null);
  const [trustAdjustReason, setTrustAdjustReason] = useState("");

  const fetchFamilyTrustData = async () => {
    if (!user?.family_id) return;
    try {
      const ts = Date.now();
      const res = await fetch(
        `${API_URL}/trust/family/${user.family_id}?_t=${ts}`,
        { headers: { "Cache-Control": "no-cache" } },
      );
      if (res.ok) {
        const data = await res.json();
        if (data.children) setFamilyTrustData(data.children);
      }
    } catch (e) {
      console.error("获取家庭信任数据失败", e);
    }
  };

  const fetchPendingResets = async () => {
    if (!user?.family_id) return;
    try {
      const ts = Date.now();
      const res = await fetch(
        `${API_URL}/auth/pending-resets?family_id=${user.family_id}&_t=${ts}`,
        { headers: { "Cache-Control": "no-cache" } },
      );
      if (res.ok) {
        const data = await res.json();
        if (data.pending_resets) setPendingResets(data.pending_resets);
      }
    } catch (e) {
      console.error("获取重置码失败", e);
    }
  };

  useEffect(() => {
    if (user?.family_id) fetchPendingResets();
  }, [user?.family_id]);

  useEffect(() => {
    if (user?.family_id) fetchFamilyTrustData();
  }, [user?.family_id]);

  const confirmTrustAdjust = async () => {
    if (!trustAdjustConfig) return;
    const result = await updateTrustScore(
      trustAdjustConfig.delta,
      trustAdjustReason || trustAdjustConfig.reason,
      trustAdjustConfig.username,
    );
    if (result) {
      showToast("信任分已调整！", "success");
      fetchFamilyTrustData();
      setTrustAdjustDelta("");
      setTrustAdjustReason("");
    } else {
      showToast("操作失败", "error");
    }
    setTrustAdjustConfig(null);
  };

  const handlePenalize = (penaltyName: string, amount: number) => {
    const childrenList = leaderboard.filter((p) => p.role === "child");
    const targetChild =
      selectedChild ||
      (childrenList.length > 0 ? childrenList[0].username : null);

    if (!targetChild) return showToast("没有可惩罚的孩子！", "error");

    setPunishModalConfig({ name: penaltyName, amount, target: targetChild });
    setPunishReason("");
  };

  const [childTransactions, setChildTransactions] = useState<any[]>([]);

  const [revertModalConfig, setRevertModalConfig] = useState<any>(null);

  const fetchChildTransactions = async (childName: string) => {
    try {
      const ts = Date.now();
      const safeName = encodeURIComponent(childName);
      const res = await fetch(
        `${API_URL}/stats/transactions?family_id=${user?.family_id}&username=${safeName}&_t=${ts}`,
      );
      if (res.ok) {
        const data = await res.json();
        // 确保 data 是数组，防止 API 返回 {error: ...} 对象导致 .slice 报错
        setChildTransactions(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("历史拉取失败", e);
    }
  };

  useEffect(() => {
    if (selectedChild) {
      fetchChildTransactions(selectedChild);
    } else {
      const childrenList = leaderboard.filter((p) => p.role === "child");
      if (childrenList.length > 0) {
        setSelectedChild(childrenList[0].username);
      }
    }
  }, [selectedChild, leaderboard.length]);

  const confirmRevert = async () => {
    if (!revertModalConfig) return;
    try {
      const tx = revertModalConfig;
      const res = await fetch(`${API_URL}/stats/revert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          family_id: user?.family_id,
          username: selectedChild,
          transaction_id: tx.id,
          source_type: tx.source_type,
          amount: tx.amount,
          title: tx.title,
        }),
      });
      if (res.ok) {
        showToast("👍 撤销流水记账成功！", "success");
        fetchAllData();
        refreshPoints();
        if (selectedChild) fetchChildTransactions(selectedChild);
      } else {
        const err = await res.json();
        showToast(err.error || "操作失败", "error");
      }
    } catch (e) {
      showToast("网络请求失败", "error");
    } finally {
      setRevertModalConfig(null);
    }
  };

  const confirmPenalize = async () => {
    if (!punishModalConfig) return;
    try {
      const res = await fetch(
        `${API_URL}/users/${punishModalConfig.target}/penalize`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            family_id: user?.family_id,
            penalty_name: punishModalConfig.name,
            amount: punishModalConfig.amount,
            reason: punishReason,
          }),
        },
      );
      if (res.ok) {
        showToast("🚨 惩罚已生效，积分已被扣除！", "success");
        fetchAllData();
        fetchChildTransactions(punishModalConfig.target);
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
          <p className="text-xs font-black text-primary/60 uppercase tracking-widest mb-1">
            当前等级
          </p>
          <h3 className="text-2xl font-black text-on-surface">
            LV.{personalStats.level}
          </h3>
        </Card>
        <Card className="p-6 bg-secondary/5 border-none shadow-none flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary mb-3">
            <Star size={24} />
          </div>
          <p className="text-xs font-black text-secondary/60 uppercase tracking-widest mb-1">
            个人积分
          </p>
          <h3 className="text-2xl font-black text-on-surface">
            {personalStats.points}
          </h3>
        </Card>
      </section>

      {/* Family Growth Trends (New Integrated Component) */}
      <TrendCards familyId={user?.family_id || ""} title="全家习惯养成趋势" />

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
              <div
                key={idx}
                className={`w-10 h-10 rounded-full border-2 border-primary ${idx === 0 ? "bg-secondary-container text-secondary" : "bg-tertiary-fixed text-on-tertiary-fixed"} flex items-center justify-center`}
              >
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
          <h2 className="text-on-primary-container font-black text-xl">
            全家英雄榜
          </h2>
        </div>

        <Card className="p-2 bg-surface-container-low border-none space-y-1">
          {!Array.isArray(leaderboard) || leaderboard.length === 0 ? (
            <p className="text-center py-6 text-on-surface-variant/40 text-sm italic font-bold">
              暂无排名数据...
            </p>
          ) : (
            leaderboard.map((player, index) => (
              <div
                key={player.username}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl transition-all",
                  player.username === user?.username
                    ? "bg-primary/10 shadow-sm border border-primary/10"
                    : "hover:bg-surface-variant/30",
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-black text-sm",
                      index === 0
                        ? "bg-[#FFD700] text-amber-900 shadow-md shadow-amber-500/20"
                        : index === 1
                          ? "bg-[#C0C0C0] text-gray-800 shadow-md shadow-gray-400/20"
                          : index === 2
                            ? "bg-[#CD7F32] text-orange-950 shadow-md shadow-orange-800/20"
                            : "bg-surface-container-high text-on-surface-variant/40",
                    )}
                  >
                    {index + 1}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface tracking-tight">
                        {player.username}
                      </span>
                      {player.role === "parent" && (
                        <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded font-black">
                          家长
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">
                      {player.level_title || `等级 ${player.level} 探险家`}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <span
                      className="text-lg font-black text-primary italic"
                      title="当前可用积分"
                    >
                      {player.points}
                    </span>
                    <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase">
                      pts
                    </span>
                  </div>
                  <div className="w-16 h-1 bg-surface-container-high rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${Math.min(100, (player.points / (leaderboard[0]?.points || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </Card>
      </section>

      {/* Punishment Panel */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-red-500" size={24} />
          <h2 className="text-on-primary-container font-black text-xl text-red-600">
            快捷惩戒中心
          </h2>
        </div>
        <Card className="p-6 border-red-500/20 bg-red-50/50 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <h3 className="font-bold text-red-900 border-l-4 border-red-500 pl-2">
              选择处分对象:
            </h3>
            <div className="flex gap-2 flex-wrap">
              {leaderboard.filter((p) => p.role === "child").length === 0 ? (
                <span className="text-sm text-red-400">目前没有数据...</span>
              ) : (
                leaderboard
                  .filter((p) => p.role === "child")
                  .map((child) => {
                    const childrenList = leaderboard.filter(
                      (c) => c.role === "child",
                    );
                    const isSelected =
                      selectedChild === child.username ||
                      (!selectedChild &&
                        childrenList.length > 0 &&
                        childrenList[0].username === child.username);
                    return (
                      <button
                        key={child.username}
                        onClick={() => setSelectedChild(child.username)}
                        className={cn(
                          "px-4 py-2 rounded-full font-bold text-sm transition-all border",
                          isSelected
                            ? "bg-red-500 text-white border-red-500 shadow-md"
                            : "bg-white text-red-500 border-red-200 hover:bg-red-50",
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
              {
                name: "警告",
                points: 10,
                bg: "bg-orange-100 hover:bg-orange-200 border-orange-200",
                text: "text-orange-700",
              },
              {
                name: "严重警告",
                points: 30,
                bg: "bg-red-100 hover:bg-red-200 border-red-200",
                text: "text-red-700",
              },
              {
                name: "记小过",
                points: 50,
                bg: "bg-rose-100 hover:bg-rose-200 border-rose-300",
                text: "text-rose-800",
              },
              {
                name: "记大过",
                points: 100,
                bg: "bg-red-600 hover:bg-red-700 border-red-700 text-white",
                text: "text-red-50",
                whiteText: true,
              },
            ].map((penalty) => (
              <button
                key={penalty.name}
                onClick={() => handlePenalize(penalty.name, penalty.points)}
                className={cn(
                  "p-3 rounded-xl border transition-all active:scale-95 flex flex-col items-center justify-center gap-1 group",
                  penalty.bg,
                )}
              >
                <span
                  className={cn(
                    "font-black text-lg",
                    penalty.whiteText ? "text-white" : penalty.text,
                  )}
                >
                  {penalty.name}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold opacity-80 uppercase tracking-widest",
                    penalty.text,
                  )}
                >
                  扣 {penalty.points} PTS
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-red-500/70 font-bold italic text-center">
            ⚠️
            注：处分将立即扣除孩子身上已拥有的积分。罚单会自动记录，但不会削弱历史总阅历。
          </p>

          {/* 流水撤回中心 (仅对已选中的孩子) */}
          {selectedChild && (
            <div className="mt-8 pt-6 border-t border-red-500/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-red-900 flex items-center gap-2">
                  {selectedChild} 的近期明细
                </h3>
                <span className="text-xs font-bold text-red-500/60 uppercase">
                  仅展示最近10条
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {childTransactions.length === 0 ? (
                  <p className="text-center py-4 text-xs font-bold text-red-900/40">
                    暂无任何流水记录
                  </p>
                ) : (
                  childTransactions.slice(0, 10).map((tx: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-red-500/10 hover:bg-white transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-on-surface">
                          {tx.title}
                        </span>
                        <span className="text-[10px] font-bold text-on-surface-variant/50">
                          {new Date(tx.time).toLocaleString("zh-CN")}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={cn(
                            "text-base font-black tabular-nums",
                            tx.type === "earn"
                              ? "text-primary"
                              : "text-red-500",
                          )}
                        >
                          {tx.type === "earn" ? "+" : ""}
                          {tx.amount}
                        </span>
                        {tx.id && (
                          <button
                            onClick={() => setRevertModalConfig(tx)}
                            className="px-3 py-1.5 rounded-lg bg-red-100/50 hover:bg-red-200 text-red-600 border border-red-200 text-xs font-bold transition-all"
                          >
                            撤回
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* ── 信任指数管理面板 ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="text-violet-500" size={24} />
          <h2 className="text-on-primary-container font-black text-xl text-violet-600">
            信任指数管理
          </h2>
        </div>

        <Card className="p-6 border-violet-500/20 bg-violet-50/50 space-y-6">
          <p className="text-xs font-bold text-violet-600/70 italic">
            💡 信任指数反映孩子的信用水平，影响积分获得倍率和商城购买权限。
          </p>

          {/* Select & Adjust controls */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <h3 className="font-bold text-violet-900 border-l-4 border-violet-500 pl-2 whitespace-nowrap">
              选择孩子:
            </h3>
            <div className="flex gap-2 flex-wrap">
              {familyTrustData.length === 0 ? (
                <span className="text-sm text-violet-400">暂无数据...</span>
              ) : (
                leaderboard
                  .filter((p) => p.role === "child")
                  .map((child) => {
                    const isSelected =
                      trustSelectedChild === child.username ||
                      (!trustSelectedChild &&
                        leaderboard.filter((c) => c.role === "child").length >
                          0 &&
                        leaderboard.filter((c) => c.role === "child")[0]
                          .username === child.username);
                    const trustInfo = familyTrustData.find(
                      (t: any, i: number) =>
                        i ===
                        leaderboard
                          .filter((c: any) => c.role === "child")
                          .indexOf(child),
                    );
                    return (
                      <button
                        key={child.username}
                        onClick={() => setTrustSelectedChild(child.username)}
                        className={cn(
                          "px-4 py-2 rounded-full font-bold text-sm transition-all border",
                          isSelected
                            ? "bg-violet-500 text-white border-violet-500 shadow-md"
                            : "bg-white text-violet-500 border-violet-200 hover:bg-violet-50",
                        )}
                      >
                        <User size={14} className="inline mr-1 -mt-0.5" />
                        {child.username}
                        {trustInfo && (
                          <span
                            className={cn(
                              "ml-1.5 text-[10px]",
                              trustInfo.trust_score >= 61
                                ? "text-green-500"
                                : trustInfo.trust_score >= 41
                                  ? "text-cyan-500"
                                  : "text-red-500",
                            )}
                          >
                            ({trustInfo.trust_score})
                          </span>
                        )}
                      </button>
                    );
                  })
              )}
            </div>
          </div>

          {/* Current trust info for selected child */}
          {trustSelectedChild &&
            (() => {
              const idx = leaderboard
                .filter((p: any) => p.role === "child")
                .findIndex((c: any) => c.username === trustSelectedChild);
              const info = idx >= 0 ? familyTrustData[idx] : null;
              if (!info) return null;
              return (
                <div className="p-4 rounded-xl bg-white border border-violet-200/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Shield
                        size={18}
                        className={cn(
                          info.trust_score >= 61
                            ? "text-green-500"
                            : info.trust_score >= 41
                              ? "text-cyan-500"
                              : "text-red-500",
                        )}
                      />
                      <span className="font-bold text-on-surface">
                        {trustSelectedChild}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-black px-3 py-1 rounded-full border",
                        info.trust_score >= 61
                          ? "bg-green-100 text-green-700 border-green-200"
                          : info.trust_score >= 41
                            ? "bg-cyan-100 text-cyan-700 border-cyan-200"
                            : "bg-red-100 text-red-700 border-red-200",
                      )}
                    >
                      {info.trust_level_title} · {info.trust_score}分 · ×
                      {info.multiplier}
                    </span>
                  </div>

                  {/* Manual adjust controls */}
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                    <div className="flex-1 w-full">
                      <p className="text-[10px] font-bold text-violet-600/80 uppercase tracking-widest mb-1 ml-1">
                        调整分值（正数加分 / 负数减分）
                      </p>
                      <Input
                        type="number"
                        placeholder="例如：+5 或 -3"
                        value={trustAdjustDelta}
                        onChange={(e) => setTrustAdjustDelta(e.target.value)}
                        className="text-center font-bold text-lg"
                      />
                    </div>
                    <div className="flex gap-2">
                      {/* Quick preset buttons */}
                      {[1, 3, 5, 10].map((val) => (
                        <button
                          key={val}
                          onClick={() => setTrustAdjustDelta(String(val))}
                          className={cn(
                            "px-3 py-2 rounded-lg text-xs font-bold border transition-all",
                            trustAdjustDelta === String(val)
                              ? "bg-green-100 text-green-700 border-green-300"
                              : "bg-white text-violet-600 border-violet-200 hover:bg-violet-50",
                          )}
                        >
                          +{val}
                        </button>
                      ))}
                      {[-1, -3, -5, -10].map((val) => (
                        <button
                          key={val}
                          onClick={() => setTrustAdjustDelta(String(val))}
                          className={cn(
                            "px-3 py-2 rounded-lg text-xs font-bold border transition-all",
                            trustAdjustDelta === String(val)
                              ? "bg-red-100 text-red-700 border-red-300"
                              : "bg-white text-violet-600 border-violet-200 hover:bg-violet-50",
                          )}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-[10px] font-bold text-violet-600/80 uppercase tracking-widest mb-1 ml-1">
                      调整原因
                    </p>
                    <Input
                      placeholder="例如：表现优秀加分 / 未遵守约定减分..."
                      value={trustAdjustReason}
                      onChange={(e) => setTrustAdjustReason(e.target.value)}
                    />
                  </div>

                  <div className="mt-4 flex gap-3">
                    <Button
                      fullWidth
                      onClick={async () => {
                        const delta = parseInt(trustAdjustDelta);
                        if (isNaN(delta) || delta === 0) {
                          showToast("请输入有效的分值（非零）", "error");
                          return;
                        }
                        if (!trustAdjustReason.trim()) {
                          showToast("请填写调整原因", "error");
                          return;
                        }
                        const result = await updateTrustScore(
                          delta,
                          trustAdjustReason,
                          trustSelectedChild,
                        );
                        if (result) {
                          showToast("信任分已调整！", "success");
                          fetchFamilyTrustData();
                          setTrustAdjustDelta("");
                          setTrustAdjustReason("");
                        } else {
                          showToast("操作失败，请重试", "error");
                        }
                      }}
                      className={cn(
                        "text-white border-none",
                        parseInt(trustAdjustDelta) > 0
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-red-500 hover:bg-red-600",
                      )}
                      disabled={
                        !trustAdjustDelta ||
                        parseInt(trustAdjustDelta) === 0 ||
                        !trustAdjustReason.trim()
                      }
                    >
                      确认调整
                    </Button>
                    <button
                      onClick={() => setShowTrustModal(true)}
                      className="whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold text-violet-500 hover:text-violet-700 border border-violet-200 hover:bg-violet-50 transition-all"
                    >
                      查看流水 →
                    </button>
                  </div>
                </div>
              );
            })()}

          {/* Children trust overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {familyTrustData.length === 0 ? (
              <div className="col-span-full text-center py-4 text-sm font-bold text-violet-400">
                暂无信任数据...
              </div>
            ) : (
              familyTrustData.map((child: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white border border-violet-200/50 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => {
                    const childList = leaderboard.filter(
                      (p: any) => p.role === "child",
                    );
                    if (childList[idx])
                      setTrustSelectedChild(childList[idx].username);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface-variant/60">
                      孩子 #{idx + 1}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded-full border",
                        child.trust_score >= 61
                          ? "bg-green-100 text-green-700 border-green-200"
                          : child.trust_score >= 41
                            ? "bg-cyan-100 text-cyan-700 border-cyan-200"
                            : "bg-red-100 text-red-700 border-red-200",
                      )}
                    >
                      {child.trust_score}分
                    </span>
                  </div>
                  <div className="mt-1 text-xs font-bold text-on-surface">
                    {child.trust_level_title}
                  </div>
                  <div className="mt-1 text-[10px] font-bold text-on-surface-variant/60">
                    倍率 ×{child.multiplier}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      {/* Trust Adjust Confirmation Modal */}
      <AnimatePresence>
        {trustAdjustConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTrustAdjustConfig(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-surface w-full max-w-sm rounded-[24px] p-8 shadow-2xl relative z-10 border border-outline/10 text-center space-y-6"
            >
              <div className="space-y-4">
                <div className="flex justify-center text-violet-500 mb-2">
                  <Shield size={48} />
                </div>
                <h3 className="text-2xl font-bold text-on-surface tracking-tight">
                  调整信任指数
                </h3>
                <p className="text-on-surface-variant leading-relaxed text-sm">
                  你即将
                  <strong
                    className={
                      trustAdjustConfig.delta > 0
                        ? "text-green-500 mx-1"
                        : "text-red-500 mx-1"
                    }
                  >
                    {trustAdjustConfig.delta > 0 ? "增加" : "减少"}{" "}
                    {Math.abs(trustAdjustConfig.delta)}
                  </strong>
                  分信任指数
                </p>
                <div className="text-left border border-violet-500/20 bg-violet-50/30 p-4 rounded-xl">
                  <p className="text-xs font-bold text-violet-700 uppercase tracking-widest mb-2">
                    调整原因
                  </p>
                  <Input
                    placeholder="例如：表现优秀加分 / 未遵守约定减分..."
                    value={trustAdjustReason}
                    onChange={(e) => setTrustAdjustReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  fullWidth
                  onClick={confirmTrustAdjust}
                  className={
                    trustAdjustConfig.delta > 0
                      ? "bg-green-500 hover:bg-green-600 text-white border-none"
                      : "bg-red-500 hover:bg-red-600 text-white border-none"
                  }
                >
                  确认调整
                </Button>
                <button
                  onClick={() => setTrustAdjustConfig(null)}
                  className="w-full py-4 text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Trust History Modal */}
      <TrustHistoryModal
        isOpen={showTrustModal}
        onClose={() => setShowTrustModal(false)}
      />

      {/* ── 密码重置审批 ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="text-amber-500" size={24} />
          <h2 className="text-on-primary-container font-black text-xl text-amber-600">
            密码重置审批
          </h2>
        </div>

        <Card className="p-6 border-amber-500/20 bg-amber-50/50 space-y-4">
          {pendingResets.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm font-bold text-amber-400">
                暂无待处理的密码重置请求 🍃
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-bold text-amber-600/70 italic">
                💡 以下孩子申请了密码重置，请将重置码告知对方。
              </p>
              {pendingResets.map((reset: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white border border-amber-200/50 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-amber-500" />
                      <span className="font-bold text-on-surface">
                        {reset.username}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(reset.reset_code);
                        showToast("✅ 重置码已复制到剪贴板", "success");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-bold border border-amber-200 transition-all"
                    >
                      复制重置码
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-amber-600/60 uppercase tracking-widest mb-1">
                        重置码
                      </p>
                      <p
                        className="text-2xl font-black text-amber-700 tracking-[0.3em] cursor-pointer select-all"
                        onClick={() => {
                          navigator.clipboard.writeText(reset.reset_code);
                          showToast("✅ 重置码已复制", "success");
                        }}
                      >
                        {reset.reset_code}
                      </p>
                    </div>
                    {reset.created_at && (
                      <p className="text-[10px] text-amber-500/60 font-bold text-right">
                        {new Date(reset.created_at).toLocaleString("zh-CN")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              fetchPendingResets();
              showToast("已刷新重置码列表", "success");
            }}
            className="w-full py-2 text-xs font-bold text-amber-500 hover:text-amber-700 transition-colors"
          >
            刷新列表
          </button>
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
            onClick={() => onNavigate && onNavigate("store")}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPunishModalConfig(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-surface w-full max-w-sm rounded-[24px] p-8 shadow-2xl relative z-10 border border-outline/10 text-center space-y-6"
            >
              <div className="space-y-4">
                <div className="flex justify-center text-red-500 mb-2">
                  <AlertTriangle size={48} />
                </div>
                <h3 className="text-2xl font-bold text-on-surface tracking-tight">
                  确认触发处分？
                </h3>
                <p className="text-on-surface-variant leading-relaxed text-sm">
                  你即将对 <strong>{punishModalConfig.target}</strong> 发出
                  <strong className="text-red-500 mx-1">
                    {punishModalConfig.name}
                  </strong>
                  处分，
                  <br />
                  将立即扣除{" "}
                  <strong className="text-red-500">
                    {punishModalConfig.amount}
                  </strong>{" "}
                  积分。
                </p>
                <div className="text-left mt-4 border border-red-500/20 bg-red-50/30 p-4 rounded-xl">
                  <p className="text-xs font-bold text-red-700 uppercase tracking-widest mb-2 pl-2 flex items-center gap-1">
                    处分原因{" "}
                    <span className="text-[10px] bg-red-100 text-red-500 px-1 rounded">
                      必填
                    </span>
                  </p>
                  <Input
                    placeholder="例如：未按时完成作业、对长辈没礼貌..."
                    value={punishReason}
                    onChange={(e) => setPunishReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  fullWidth
                  onClick={confirmPenalize}
                  className={cn(
                    "border-none text-white",
                    punishReason.trim()
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-red-300",
                  )}
                  disabled={!punishReason.trim()}
                >
                  确认扣除 {punishModalConfig.amount} 分
                </Button>
                <button
                  onClick={() => setPunishModalConfig(null)}
                  className="w-full py-4 text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  取消操作
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Revert Confirmation Modal */}
      <AnimatePresence>
        {revertModalConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRevertModalConfig(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-surface w-full max-w-sm rounded-[24px] p-8 shadow-2xl relative z-10 border border-outline/10 text-center space-y-6"
            >
              <div className="space-y-4">
                <div className="flex justify-center text-red-500 mb-2">
                  <AlertTriangle size={48} />
                </div>
                <h3 className="text-2xl font-bold text-on-surface tracking-tight">
                  撤回操作确认
                </h3>
                <p className="text-on-surface-variant leading-relaxed text-sm">
                  你即将撤销 <strong>{selectedChild}</strong> 的流水记录：
                  <br />
                  <strong className="text-primary mx-1">
                    {revertModalConfig.title}
                  </strong>
                  <br />
                  <span className="text-xs opacity-70 mt-2 block">
                    系统将追加一笔反向流水以抵消本次操作。
                  </span>
                </p>
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  fullWidth
                  onClick={confirmRevert}
                  className="bg-red-500 hover:bg-red-600 text-white border-none"
                >
                  确认执行撤销
                </Button>
                <button
                  onClick={() => setRevertModalConfig(null)}
                  className="w-full py-4 text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  暂不操作
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
              toastMsg.type === "success"
                ? "bg-red-50 text-red-600 border-red-200"
                : "bg-surface-container-high text-on-surface border-surface-variant/30",
            )}
          >
            {toastMsg.type === "success" && <AlertTriangle size={16} />}
            {toastMsg.title}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
