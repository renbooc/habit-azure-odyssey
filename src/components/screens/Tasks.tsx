import React, { useEffect, useState } from 'react';
import { Settings2, Plus, Star, Target, Shield, Ship, CheckCircle2, ChevronRight, X, Sparkles } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { API_URL } from '@/src/api_config';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Button } from '@/src/components/ui/Button';
import { cn } from '@/src/lib/utils';
import { useUser } from '@/src/context/UserContext';

// Sub-components
import { TaskCard } from '../tasks/TaskCard';
import { TimerOverlay } from '../tasks/TimerOverlay';
import { AddTaskModal } from '../tasks/AddTaskModal';
import { TemplateManagerModal } from '../tasks/TemplateManagerModal';

interface Task {
  id: string;
  title: string;
  points: number;
  icon: string;
  username?: string;
  completed: boolean;
  task_type?: 'checkbox' | 'timer';
  target_duration?: number;
}

interface TaskTemplate {
  id: string;
  title: string;
  points: number;
  icon: string;
  is_daily?: boolean;
}

export const Tasks = ({ role = 'parent', onSelectTask }: { role?: string, onSelectTask?: (taskId: string) => void }) => {
  const { user, refreshPoints } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [presets, setPresets] = useState<TaskTemplate[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isManagingTemplates, setIsManagingTemplates] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPoints, setNewTaskPoints] = useState<string | number>('10');
  const [newTaskIcon, setNewTaskIcon] = useState('Star');
  const [newTaskIsDaily, setNewTaskIsDaily] = useState(false);
  const [newTaskType, setNewTaskType] = useState<'checkbox' | 'timer'>('checkbox');
  const [newTaskDuration, setNewTaskDuration] = useState<string | number>('30');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);
  const [activeTimer, setActiveTimer] = useState<{ id: string, title: string, remaining: number, isPaused: boolean } | null>(null);

  const API_BASE = `${API_URL}/tasks`;

  useEffect(() => {
    fetchTasks();
    fetchPresets();
  }, [user?.username]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer && !activeTimer.isPaused && activeTimer.remaining > 0) {
      interval = setInterval(() => {
        setActiveTimer(prev => prev ? { ...prev, remaining: prev.remaining - 1 } : null);
      }, 1000);
    } else if (activeTimer && activeTimer.remaining === 0) {
      toggleTask(activeTimer.id);
      setActiveTimer(null);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const fetchTasks = async () => {
    try {
      // 传入当前用户的 username 以触发后端生成属于该用户的每日任务
      const queryParams = new URLSearchParams({
        family_id: user?.family_id || '',
        username: user?.username || '',
        _t: Date.now().toString()
      });

      // 如果是家长视角，请求全家所有人的任务以供预览/管理
      if (role === 'parent') {
        queryParams.append('all_family', 'true');
      }

      const res = await fetch(`${API_BASE}/?${queryParams.toString()}`, { headers: { 'Cache-Control': 'no-cache' } });
      if (res.ok) {
        let fetchedTasks = await res.json();
        // 如果是家长视角，针对全家所有成员分发的多份冗余任务进行去重展示
        if (role === 'parent') {
          const uniqueTitleMap = new Map();
          fetchedTasks.forEach((t: any) => {
            const existing = uniqueTitleMap.get(t.title);
            // 策略优先：如果这个任务记录归属于当前操作的家长本人，则它是最高优先级的“主记录”
            // 这样当家长点击完成或启动计时器时，操作的是家长自己的 Task ID，积分才会记在家长名下
            if (!existing || t.username === user?.username) {
              uniqueTitleMap.set(t.title, t);
            }
          });
          fetchedTasks = Array.from(uniqueTitleMap.values());
        }
        setTasks(fetchedTasks);
      }
    } catch (e) { console.error('Failed to fetch tasks', e); }
    finally { setLoading(false); }
  };

  const fetchPresets = async () => {
    try {
      const res = await fetch(`${API_URL}/tasks/templates`);
      if (res.ok) setPresets(await res.json());
    } catch (e) { console.error('Failed to fetch presets', e); }
  };

  const triggerConfetti = () => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#6366f1', '#a855f7', '#ec4899'] });
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    if (!task.completed) triggerConfetti();
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));

    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed: !task.completed,
          family_id: user?.family_id,
          username: user?.username
        })
      });
      if (res.ok && !task.completed) refreshPoints();
    } catch (error) {
      console.error('更新任务失败:', error);
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: task.completed } : t));
    }
  };

  const addTask = async (title: string, points: number, icon: string, is_daily: boolean = false, type: 'checkbox' | 'timer' = 'checkbox', duration: number = 30) => {
    try {
      const res = await fetch(`${API_BASE}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: user?.family_id,
          username: user?.username,
          title, points, icon, completed: false, is_daily, task_type: type, target_duration: duration
        })
      });
      if (res.ok) {
        setIsAdding(false);
        resetForm();
        fetchTasks();
      }
    } catch (e) { console.error(e); }
  };

  const deleteTask = (id: string) => {
    setConfirmConfig({
      title: '确认要删除吗？',
      message: '删除后的任务无法找回，相关进度也会消失。',
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
          if (res.ok) {
            fetchTasks();
            setConfirmConfig(null);
          }
        } catch (e) { console.error(e); }
      }
    });
  };

  const addTemplate = async () => {
    try {
      const res = await fetch(`${API_URL}/tasks/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          points: parseInt(newTaskPoints.toString()),
          icon: newTaskIcon,
          is_daily: newTaskIsDaily,
          task_type: newTaskType,
          target_duration: parseInt(newTaskDuration.toString())
        })
      });
      if (res.ok) { resetForm(); fetchPresets(); }
    } catch (e) { console.error(e); }
  };

  const deleteTemplate = (id: string) => {
    setConfirmConfig({
      title: '删除这个模板？',
      message: '删除后，所有基于此模板的任务将不再能一键发布。',
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_URL}/tasks/templates/${id}`, { method: 'DELETE' });
          if (res.ok) {
            fetchPresets();
            setConfirmConfig(null);
          }
        } catch (e) { console.error(e); }
      }
    });
  };

  const resetForm = () => {
    setNewTaskTitle('');
    setNewTaskPoints('10');
    setNewTaskIcon('Star');
    setNewTaskIsDaily(false);
    setNewTaskType('checkbox');
    setNewTaskDuration('30');
  };

  return (
    <div className="pb-32">
      <AnimatePresence>
        {activeTimer && (
          <TimerOverlay
            title={activeTimer.title}
            remaining={activeTimer.remaining}
            isPaused={activeTimer.isPaused}
            onTogglePause={() => setActiveTimer({ ...activeTimer, isPaused: !activeTimer.isPaused })}
            onCancel={() => setActiveTimer(null)}
          />
        )}
      </AnimatePresence>

      <header className="flex flex-wrap justify-between items-center gap-4 px-2 mb-8">
        <div className="flex-1 min-w-[150px]">
          <h2 className="text-3xl font-black text-on-surface tracking-tight">任务大厅</h2>
          <p className="text-sm text-on-surface-variant/60 font-medium tracking-wide">
            {role === 'parent' ? '为全家规划大挑战' : '规划你的探险计划'}
          </p>
        </div>
        <div className="flex gap-2 relative z-10 shrink-0">
          {role === 'parent' && (
            <Button size="sm" variant="ghost" onClick={() => setIsManagingTemplates(true)} className="whitespace-nowrap px-4 border border-outline-variant/30">
              <Settings2 size={16} className="mr-1.5 opacity-70" />
              管理挑战库
            </Button>
          )}
          <Button size="sm" onClick={() => setIsAdding(true)} className={cn("whitespace-nowrap px-5", role === 'child' ? "bg-secondary text-on-secondary shadow-lg shadow-secondary/20" : "shadow-lg")}>
            <Plus size={18} className="mr-1.5" />
            {role === 'child' ? '找挑战' : '立即发悬赏'}
          </Button>
        </div>
      </header>

      <div className="space-y-4 px-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-sm font-bold text-on-surface-variant/40">加载任务中...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20 px-8 rounded-[2rem] bg-surface-container-low border-2 border-dashed border-outline-variant/30">
            <Star size={48} className="mx-auto text-on-surface-variant/20 mb-4" />
            <p className="text-on-surface-variant/60 font-bold mb-2">暂无任务</p>
            <p className="text-xs text-on-surface-variant/40">快去为孩子开启今日的第一份挑战吧！</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {tasks
              .map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <TaskCard
                    task={task}
                    role={role}
                    onToggle={() => toggleTask(task.id)}
                    onStartTimer={() => setActiveTimer({ id: task.id, title: task.title, remaining: (task.target_duration || 30) * 60, isPaused: false })}
                    onDelete={() => deleteTask(task.id)}
                  />
                </motion.div>
              ))}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <AddTaskModal
            role={role}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            newTaskTitle={newTaskTitle}
            onTitleChange={setNewTaskTitle}
            newTaskPoints={newTaskPoints}
            onPointsChange={setNewTaskPoints}
            newTaskIcon={newTaskIcon}
            onIconChange={setNewTaskIcon}
            newTaskType={newTaskType}
            onTypeChange={setNewTaskType}
            newTaskDuration={newTaskDuration}
            onDurationChange={setNewTaskDuration}
            newTaskIsDaily={newTaskIsDaily}
            onIsDailyChange={setNewTaskIsDaily}
            onClose={() => setIsAdding(false)}
            onAdd={(preset) => {
              if (role === 'child' && preset) {
                addTask(preset.title, preset.points, preset.icon, false, preset.task_type || 'checkbox', preset.target_duration || 30);
              } else {
                addTask(newTaskTitle, parseInt(newTaskPoints.toString()) || 10, newTaskIcon, newTaskIsDaily, newTaskType, parseInt(newTaskDuration.toString()) || 30);
              }
            }}
            presets={presets.filter(p => p.title.includes(searchTerm))}
          />
        )}

        {isManagingTemplates && (
          <TemplateManagerModal
            onClose={() => setIsManagingTemplates(false)}
            presets={presets}
            onAdd={addTemplate}
            onDelete={deleteTemplate}
            newTaskTitle={newTaskTitle}
            onTitleChange={setNewTaskTitle}
            newTaskPoints={newTaskPoints}
            onPointsChange={setNewTaskPoints}
            newTaskIsDaily={newTaskIsDaily}
            onIsDailyChange={setNewTaskIsDaily}
            newTaskType={newTaskType}
            onTypeChange={setNewTaskType}
            newTaskDuration={newTaskDuration}
            onDurationChange={setNewTaskDuration}
          />
        )}
      </AnimatePresence>

      <Modal
        isOpen={!!confirmConfig}
        onClose={() => setConfirmConfig(null)}
        onConfirm={() => confirmConfig?.onConfirm()}
        title={confirmConfig?.title || '确认操作'}
        message={confirmConfig?.message || '您确定要执行此操作吗？'}
        confirmText="无情执行"
        cancelText="我再想想"
        type="danger"
      />
    </div>
  );
};
