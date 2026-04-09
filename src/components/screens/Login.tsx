import React, { useState } from 'react';
import { Input } from '@/src/components/ui/Input';
import { API_URL } from '@/src/api_config';
import { Button } from '@/src/components/ui/Button';
import { User, Lock, ArrowRight, Baby, Users } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: (user: any) => void;
  onNavigateToRegister: () => void;
}

export const Login = ({ onLogin, onNavigateToRegister }: LoginProps) => {
  const [role, setRole] = useState<'parent' | 'child'>('parent');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('请输入账号和密码');
      return;
    }

    setLoading(true);
    try {
      // 关键修复：统一转为小写，解决手机浏览器自动首字母大写导致的查询失败
      const normalizedUsername = username.trim().toLowerCase();
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalizedUsername, password, role })
      });

      if (res.ok) {
        const data = await res.json();
        onLogin(data);
      } else {
        const errData = await res.json();
        setError(errData.detail || '密码错误或账号不存在');
      }
    } catch (err) {
      console.error('Login error', err);
      setError('网络请求失败，请检查服务是否开启');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden bg-background">
      {/* Background Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-container opacity-20 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary-container opacity-20 blur-[100px]" />

      <div className="w-full max-w-md z-10 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-on-primary-container tracking-tight">欢迎回来！</h2>
          <p className="text-on-surface-variant/80">开启您的海洋奇幻探索之旅</p>
        </div>

        {/* Role Selector */}
        <div className="bg-surface-container-low p-1.5 rounded-full flex gap-1 relative shadow-inner">
          <button
            onClick={() => setRole('parent')}
            className={`flex-1 py-3 px-6 rounded-full font-semibold transition-all flex items-center justify-center gap-2 ${role === 'parent' ? 'primary-gradient text-white shadow-md' : 'text-on-surface-variant'
              }`}
          >
            <Users size={20} />
            我是家长
          </button>
          <button
            onClick={() => setRole('child')}
            className={`flex-1 py-3 px-6 rounded-full font-semibold transition-all flex items-center justify-center gap-2 ${role === 'child' ? 'primary-gradient text-white shadow-md' : 'text-on-surface-variant'
              }`}
          >
            <Baby size={20} />
            我是孩子
          </button>
        </div>

        <div className="bg-surface rounded-xl p-8 shadow-ambient border border-outline-variant/10 space-y-6">
          <form className="space-y-6" onSubmit={handleLogin}>
            <Input
              label="手机号 / 用户名"
              placeholder="请输入您的账号"
              icon={<User size={20} />}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="block text-sm font-semibold text-on-primary-container ml-4">密码</label>
                <button type="button" className="text-xs font-medium text-primary hover:opacity-80">忘记密码？</button>
              </div>
              <Input
                placeholder="请输入您的密码"
                type="password"
                icon={<Lock size={20} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm font-bold text-center animate-pulse">{error}</p>}
            <Button fullWidth type="submit" disabled={loading}>
              {loading ? '登录中...' : '立即登录'}
              {!loading && <ArrowRight size={20} />}
            </Button>
          </form>

          <p className="text-center text-on-surface-variant text-sm">
            还没有账号？{' '}
            <button onClick={onNavigateToRegister} className="text-primary font-bold hover:underline">立即注册</button>
          </p>
        </div>
      </div>
    </div>
  );
};
