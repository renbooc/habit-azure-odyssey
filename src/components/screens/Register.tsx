import React, { useState } from 'react';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { User, Lock, Shield, Ship } from 'lucide-react';

interface RegisterProps {
  onRegister: () => void;
  onNavigateToLogin: () => void;
}

export const Register = ({ onRegister, onNavigateToLogin }: RegisterProps) => {
  const [role, setRole] = useState<'parent' | 'child'>('parent');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');

    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为 6 位');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });

      if (res.ok) {
        // 注册成功后可直接视为登录，或返回登录页
        // 这里沿用原来的直接执行 onRegister
        onRegister();
      } else {
        const errData = await res.json();
        setError(errData.detail || '注册失败，可能用户名已存在');
      }
    } catch (err) {
      console.error('Register error', err);
      setError('网络请求失败，请检查服务是否开启');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden bg-background">
      {/* Background Decorations */}
      <div className="absolute -z-10 bottom-0 right-0 w-full h-1/2 opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-primary-container blur-3xl" />
        <div className="absolute bottom-40 -left-20 w-80 h-80 rounded-full bg-secondary-container blur-3xl" />
      </div>

      <div className="max-w-md w-full space-y-10 z-10">
        <div className="text-center space-y-2">
          <h2 className="text-on-primary-container text-3xl font-extrabold tracking-tight">创建新账号</h2>
          <p className="text-on-surface-variant">开启您的蔚蓝探索之旅</p>
        </div>

        <div className="space-y-6">
          <Input
            label="用户名"
            placeholder="请输入用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            label="设置密码"
            type="password"
            placeholder="请输入 6-16 位密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="space-y-3">
            <label className="block text-on-surface-variant font-semibold text-sm ml-4">选择您的角色</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setRole('parent')}
                className={`group relative overflow-hidden p-5 rounded-lg border-2 transition-all text-left ${role === 'parent' ? 'bg-surface border-primary-container shadow-md' : 'bg-surface/50 border-transparent'
                  }`}
              >
                <div className="flex flex-col gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${role === 'parent' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                    }`}>
                    <User size={20} />
                  </div>
                  <span className="font-bold text-on-primary-container">我是家长</span>
                </div>
                <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform">
                  <Shield size={64} />
                </div>
              </button>
              <button
                onClick={() => setRole('child')}
                className={`group relative overflow-hidden p-5 rounded-lg border-2 transition-all text-left ${role === 'child' ? 'bg-surface border-secondary-container shadow-md' : 'bg-surface/50 border-transparent'
                  }`}
              >
                <div className="flex flex-col gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${role === 'child' ? 'bg-secondary text-white' : 'bg-secondary/10 text-secondary'
                    }`}>
                    <User size={20} />
                  </div>
                  <span className="font-bold text-on-primary-container">我是孩子</span>
                </div>
                <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform">
                  <Ship size={64} />
                </div>
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 px-2">
            <input type="checkbox" className="mt-1 w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary-container" />
            <p className="text-sm text-on-surface-variant leading-relaxed">
              我已阅读并同意 <button className="text-primary font-medium">《用户协议》</button> 与 <button className="text-primary font-medium">《隐私政策》</button>，并愿意加入这场发现之旅。
            </p>
          </div>

          {error && <p className="text-red-500 text-sm font-bold text-center animate-pulse">{error}</p>}

          <Button fullWidth onClick={handleRegister} disabled={loading}>
            {loading ? '注册中...' : '注册并登录'}
          </Button>

          <div className="text-center pt-4">
            <p className="text-on-surface-variant">
              已有账号？ <button onClick={onNavigateToLogin} className="text-primary font-bold hover:underline">立即登录</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
