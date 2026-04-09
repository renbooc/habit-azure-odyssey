import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { useUser } from '@/src/context/UserContext';
import { API_URL } from '@/src/api_config';
import { ArrowLeft, Check, Pause, Play, BadgeCheck, BookOpen, Bed, Leaf, Droplets, Puzzle } from 'lucide-react';

interface TaskDetailProps {
  taskId: string;
  onBack: () => void;
}

const icons = {
  'BookOpen': BookOpen,
  'Bed': Bed,
  'Check': Check,
  'Puzzle': Puzzle,
  'Leaf': Leaf,
  'Droplets': Droplets
} as const;

export const TaskDetail = ({ taskId, onBack }: TaskDetailProps) => {
  const { user, refreshPoints } = useUser();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  // Timer states
  const INITIAL_TIME = (task?.target_duration || 2) * 60;
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [isActive, setIsActive] = useState(false);

  const handleComplete = useCallback(async () => {
    if (!task || completing) return;
    setCompleting(true);
    try {
      const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed: true,
          family_id: user?.family_id,
          username: user?.username
        })
      });
      if (res.ok) {
        refreshPoints();
        onBack();
      }
    } catch (err) {
      console.error('Failed to complete task', err);
    } finally {
      setCompleting(false);
    }
  }, [task, completing, taskId, onBack, user, refreshPoints]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      clearInterval(interval);
      // Automatically complete when the timer runs out!
      if (task && !task.completed) {
        handleComplete();
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, task, handleComplete]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await fetch(`${API_URL}/tasks/${taskId}?family_id=${user?.family_id}&username=${user?.username}`);
        if (res.ok) {
          const data = await res.json();
          setTask(data);
          // 修正：拉取任务后，根据任务实际配置时长更新倒计时
          setTimeLeft((data.target_duration || 2) * 60);
        }
      } catch (err) {
        console.error('Failed to fetch task detail', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [taskId, user]);



  if (loading) {
    return <div className="p-8 text-center text-on-surface-variant">正在加载任务详情...</div>;
  }

  if (!task) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-on-surface-variant">任务不存在或已被删除</p>
        <Button onClick={onBack}>返回</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-extrabold text-on-primary-container">任务执行</h1>
      </div>

      {/* Title Section (Optimized top layout without the huge circle) */}
      <section className="flex flex-col items-center justify-center text-center space-y-4 pt-4">
        <div>
          <h2 className="text-3xl font-black text-on-surface tracking-tight">{task.title}</h2>
          <p className="text-on-surface-variant/80 mt-3 text-sm max-w-sm mx-auto leading-relaxed">
            {task.completed ? '🎉 这个任务已经完成啦，你真棒！' : '准备好了吗？开启专注挑战，完成即得惊喜奖励。'}
          </p>
        </div>
      </section>

      {/* Timer Section (Restored SVG Ring Progress) */}
      {!task.completed && (
        <Card className="flex flex-col items-center justify-center border-none bg-transparent">
          <div className="relative flex items-center justify-center w-64 h-64">
            <svg className="w-full h-full transform -rotate-90 drop-shadow-sm">
              <circle
                className="text-surface-container-high"
                cx="128" cy="128" fill="transparent" r="110"
                stroke="currentColor" strokeWidth="16"
              />
              <circle
                className="text-primary transition-all duration-1000 ease-linear"
                cx="128" cy="128" fill="transparent" r="110"
                stroke="currentColor" strokeWidth="16"
                strokeDasharray="691.15"
                strokeDashoffset={691.15 - (timeLeft / INITIAL_TIME) * 691.15}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-on-primary-container tabular-nums tracking-tighter">
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs font-bold text-primary uppercase tracking-widest mt-2 bg-primary/10 px-3 py-1 rounded-full">
                {isActive ? '专注中' : '专注时间'}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4 w-full max-w-xs">
            <button
              onClick={toggleTimer}
              className={`w-full font-bold py-4 rounded-full flex items-center justify-center gap-2 transition-all shadow-md ${isActive
                ? 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
                : 'bg-primary text-white hover:bg-primary/90 hover:scale-105'
                }`}
            >
              {isActive ? (
                <><Pause size={20} /> 暂停</>
              ) : (
                <><Play size={20} className="fill-current" /> 开始</>
              )}
            </button>
            <button
              onClick={handleComplete}
              disabled={completing}
              className="text-sm font-bold text-on-surface-variant/60 hover:text-primary transition-colors flex items-center justify-center gap-1 mt-2"
            >
              {completing ? '提交中...' : <><Check size={16} /> 提前完成</>}
            </button>
            <p className="text-center text-xs text-on-surface-variant/50 font-medium flex items-center gap-1 mt-4">
              <BadgeCheck size={14} /> 专注倒计时结束后将自动确认并 +{task.points} 奖励积分
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
