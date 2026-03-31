import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { Login } from './components/screens/Login';
import { Register } from './components/screens/Register';
import { ChildDashboard } from './components/screens/ChildDashboard';
import { ParentDashboard } from './components/screens/ParentDashboard';
import { Tasks } from './components/screens/Tasks';
import { TaskDetail } from './components/screens/TaskDetail';
import { Achievements } from './components/screens/Achievements';
import { Store } from './components/screens/Store';
import { useUser } from './context/UserContext';

type Screen = 'login' | 'register' | 'dashboard' | 'admin' | 'tasks' | 'task-detail' | 'achievements' | 'store';

export default function App() {
  const { user, role, points, login, logout, refreshPoints, updateAvatar } = useUser();

  const [screen, setScreen] = useState<Screen>('login');
  const [activeTab, setActiveTab] = useState('home');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Sync screen with user presence on hydration
  React.useEffect(() => {
    if (user && screen === 'login') {
      setScreen('dashboard');
    }
  }, [user, screen]);

  const handleLogin = (userData: any) => {
    login(userData);
    setScreen('dashboard');
    setActiveTab('home');
  };

  const handleLogout = () => {
    logout();
    setScreen('login');
    setActiveTab('home');
    setSelectedTaskId(null);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'home') setScreen('dashboard');
    else if (tab === 'badges') setScreen('achievements');
    else if (tab === 'store') setScreen('store');
    else if (tab === 'tasks') setScreen('tasks');
    else if (tab === 'parent') setScreen('admin');
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setScreen('task-detail');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return '夜深了';
    if (hour < 9) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    if (hour < 22) return '傍晚好';
    return '夜深了';
  };

  // If not logged in, only show login/register
  if (!user && screen !== 'register') {
    return (
      <div className="min-h-screen bg-background">
        <Login onLogin={handleLogin} onNavigateToRegister={() => setScreen('register')} />
      </div>
    );
  }

  if (!user && screen === 'register') {
    return (
      <div className="min-h-screen bg-background">
        <Register onNavigateToLogin={() => setScreen('login')} onRegister={() => setScreen('login')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        title={getGreeting()}
        points={points}
        username={user?.username}
        avatarUrl={user?.avatar}
        onLogout={handleLogout}
        onAvatarChange={updateAvatar}
      />

      <main className="flex-grow px-6 py-8 max-w-2xl mx-auto w-full pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {screen === 'dashboard' && <ChildDashboard onSelectTask={handleSelectTask} />}
            {screen === 'admin' && role === 'parent' && <ParentDashboard onNavigate={setScreen} />}
            {screen === 'tasks' && <Tasks role={role} onSelectTask={handleSelectTask} />}
            {screen === 'task-detail' && selectedTaskId && (
              <TaskDetail taskId={selectedTaskId} onBack={() => setScreen('dashboard')} />
            )}
            {screen === 'achievements' && <Achievements />}
            {screen === 'store' && <Store userPoints={points} role={role} onPurchase={refreshPoints} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} role={role} />
    </div>
  );
}
