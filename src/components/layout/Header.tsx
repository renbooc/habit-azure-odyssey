import React, { useState } from 'react';
import { Star, LogOut, ImagePlus, X } from 'lucide-react';

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

  const fallbackAvatar = "https://picsum.photos/seed/avatar/100/100";

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
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low text-primary font-bold">
          <Star size={18} className="fill-primary" />
          <span className="text-sm">{points} 积分</span>
        </div>
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
    </>
  );
};
