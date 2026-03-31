import React from 'react';
import { Home, CheckSquare, Award, Settings2, ShoppingBag } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  role: 'parent' | 'child';
}

export const BottomNav = ({ activeTab, onTabChange, role }: BottomNavProps) => {
  const tabs = role === 'child'
    ? [
      { id: 'home', label: '首页', icon: Home },
      { id: 'tasks', label: '任务', icon: CheckSquare },
      { id: 'badges', label: '勋章', icon: Award },
      { id: 'store', label: '商城', icon: ShoppingBag },
    ]
    : [
      { id: 'home', label: '首页', icon: Home },
      { id: 'tasks', label: '任务', icon: CheckSquare },
      { id: 'badges', label: '勋章', icon: Award },
      { id: 'store', label: '商城', icon: ShoppingBag },
      { id: 'parent', label: '管理', icon: Settings2 },
    ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
      <div className="glass-effect rounded-full shadow-ambient flex justify-around items-center h-20 px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative flex flex-col items-center justify-center transition-all duration-300',
                isActive ? 'text-white' : 'text-on-surface-variant/60 hover:text-primary'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-10 w-14 h-14 primary-gradient rounded-full shadow-lg shadow-primary/30 flex items-center justify-center"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <Icon size={24} />
                </motion.div>
              )}
              <div className={cn('flex flex-col items-center gap-1', isActive && 'mt-8')}>
                {!isActive && <Icon size={24} />}
                <span className="text-[10px] font-bold">{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
