import React, { useState, useEffect } from 'react';
import { Star, LogOut, ImagePlus, X, History, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { API_URL } from '@/src/api_config';
import { useUser } from '@/src/context/UserContext';
import { cn } from '@/src/lib/utils';

interface HeaderProps {
  title: string;
  points?: number;
  avatarUrl?: string;
  username?: string;
  onLogout?: () => void;
  onAvatarChange?: (newUrl: string) => void;
}

const PRESET_AVATARS = [
  "https://picsum.photos/seed/fox/100/100",
  "https://picsum.photos/seed/bear/100/100",
  "https://picsum.photos/seed/cat/100/100",
  "https://picsum.photos/seed/dog/100/100",
  "https://picsum.photos/seed/rabbit/100/100",
  "https://picsum.photos/seed/bird/100/100",
  "https://picsum.photos/seed/lion/100/100",
  "https://picsum.photos/seed/tiger/100/100",
  "/avatars/curry.png",
  "/avatars/irving.png",
  "/avatars/durant.png",
  "/avatars/jordan.png",
];

export const Header = ({ title, points = 125, avatarUrl, username, onLogout, onAvatarChange }: HeaderProps) => {
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { user } = useUser();

  const fallbackAvatar = "https://picsum.photos/seed/avatar/100/100";

  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const safeFamilyId = encodeURIComponent(user.family_id);
      const safeUsername = encodeURIComponent(user.username);
      const ts = Date.now();
      const res = await fetch(`${API_URL}/stats/transactions?family_id=${safeFamilyId}&username=${safeUsername}&_t=${ts}`, {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      if (res.ok) {
        setTransactions(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (showHistoryModal) {
      fetchHistory();
    }
  }, [showHistoryModal]);

  return (
    <>
      <header className="glass-effect rounded-b-xl sticky top-0 z-40 shadow-ambient flex justify-between items-center w-full px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowAvatarModal(true)}
              className="w-12 h-12 rounded-full overflow-hidden bg-primary-container border-2 border-primary-container/20 hover:scale-105 transition-transform group relative"
            >
              <img
                src={avatarUrl || fallbackAvatar}
                alt="Avatar"
                className="w-full h-full object-cover group-hover:opacity-40 transition-opacity"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-primary bg-black/10">
                <ImagePlus size={18} />
              </div>
            </button>

            <button
              onClick={onLogout}
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-surface rounded-full flex items-center justify-center text-on-surface-variant hover:text-red-500 hover:scale-110 transition-all shadow-sm"
              title="退出登录"
            >
              <LogOut size={12} />
            </button>
          </div>

          <div className="flex flex-col justify-center">
            {username && (
              <span className="text-sm font-bold text-on-surface-variant/80">
                {username}
              </span>
            )}
            <h1 className="text-xl font-extrabold text-on-primary-container tracking-tight leading-tight">
              {title}
            </h1>
          </div>
        </div>
        <button
          onClick={() => setShowHistoryModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low text-primary font-bold hover:bg-primary/10 transition-colors shadow-sm border border-primary/10 active:scale-95 cursor-pointer outline-none"
        >
          <Star size={18} className="fill-primary" />
          <span className="text-sm">{points} 积分</span>
        </button>
      </header>

      {/* Avatar Selection Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-surface rounded-2xl w-full max-w-sm p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowAvatarModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant/60 hover:text-on-surface"
            >
              <X size={20} />
            </button>

            <div className="text-center">
              <h3 className="text-xl font-bold text-on-surface">选择新头像</h3>
              <p className="text-sm text-on-surface-variant mt-1">为你挑选一个特别的形象</p>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {PRESET_AVATARS.map((url, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onAvatarChange?.(url);
                    setShowAvatarModal(false);
                  }}
                  className={`w-16 h-16 rounded-full overflow-hidden border-4 transition-all hover:scale-110 shadow-sm ${avatarUrl === url ? 'border-primary' : 'border-transparent'
                    }`}
                >
                  <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAvatarModal(false)}
              className="w-full py-3 rounded-full bg-surface-container-high font-bold hover:bg-surface-variant transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-surface rounded-[24px] w-full max-w-md p-6 space-y-6 shadow-2xl relative max-h-[80vh] flex flex-col">
            <button
              onClick={() => setShowHistoryModal(false)}
              className="absolute top-4 right-4 p-2 bg-surface-container-high rounded-full text-on-surface-variant hover:text-on-surface transition-colors focus:outline-none"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-4">
              <History className="text-primary" size={24} />
              <h3 className="text-xl font-bold text-on-surface tracking-tight">积分变动流水</h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pr-2 pb-2">
              {loadingHistory ? (
                <div className="py-10 text-center text-on-surface-variant/60 font-bold border border-outline-variant/30 rounded-xl bg-surface-container-low/50">流水查询中...</div>
              ) : transactions.length === 0 ? (
                <div className="py-10 text-center text-on-surface-variant/60 font-bold border border-outline-variant/30 rounded-xl bg-surface-container-low/50">暂无任何记录产生 🍃</div>
              ) : (
                transactions.map((t, idx) => {
                  const isEarn = t.type === 'earn';
                  const dateInfo = new Date(t.time).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={idx} className="flex justify-between items-center p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shadow-sm", isEarn ? "bg-green-100 text-green-600 border border-green-200" : "bg-red-100 text-red-600 border border-red-200")}>
                          {isEarn ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-[13px] text-on-surface line-clamp-1">{t.title}</span>
                          <span className="text-[10px] text-on-surface-variant/60 font-bold tracking-widest">{dateInfo}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={cn("font-black text-lg", isEarn ? "text-green-600" : "text-red-500")}>
                          {isEarn ? '+' : ''}{t.amount}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
