import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/src/api_config';

interface User {
    id: string;
    username: string;
    role: 'parent' | 'child';
    family_id: string;
    avatar?: string;
}

interface UserContextType {
    user: User | null;
    role: 'parent' | 'child';
    points: number;
    login: (userData: any) => void;
    logout: () => void;
    refreshPoints: () => Promise<void>;
    updateAvatar: (url: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<'parent' | 'child'>('parent');
    const [points, setPoints] = useState(0);

    const isRefreshing = React.useRef(false);
    const refreshPoints = useCallback(async () => {
        if (isRefreshing.current) return;

        const saved = localStorage.getItem('currentUser');
        if (!saved) return;

        try {
            const currentUser = JSON.parse(saved);
            if (!currentUser || !currentUser.family_id) return;

            isRefreshing.current = true;
            const res = await fetch(`${API_URL}/stats/child?family_id=${currentUser.family_id}&username=${currentUser.username}`);
            if (res.ok) {
                const data = await res.json();
                // 只有在获取到数值时才更新，防止 undefined 或 null 导致清零
                if (typeof data.points === 'number' || typeof data.water_drops === 'number') {
                    setPoints(data.points ?? data.water_drops ?? 0);
                }
            } else {
                console.warn('Refresh points failed:', res.status);
            }
        } catch (err) {
            console.error('Failed to refresh points:', err);
        } finally {
            setTimeout(() => { isRefreshing.current = false; }, 1000);
        }
    }, []);

    const login = (userData: any) => {
        setUser(userData);
        setRole(userData.role);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        // 登录后稍等片刻待 state 更新或直接基于 userData 刷新
        setTimeout(() => refreshPoints(), 100);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('currentUser');
    };

    const updateAvatar = async (url: string) => {
        if (!user) return;
        try {
            const res = await fetch(`${API_URL}/users/${user.username}/avatar`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatar: url })
            });
            if (res.ok) {
                const updatedUser = { ...user, avatar: url };
                setUser(updatedUser);
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            }
        } catch (err) {
            console.error('Failed to update avatar:', err);
        }
    };

    // Auto-hydrating user from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('currentUser');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setUser(parsed);
                setRole(parsed.role);
                // 首次快速尝试
                refreshPoints();

                // 保底重试：移动端环境复杂，3秒后再做一次覆盖刷新，确保最终数据正确
                const timer = setTimeout(() => {
                    refreshPoints();
                }, 3000);
                return () => clearTimeout(timer);
            } catch (e) {
                console.error('Failed to parse saved user', e);
            }
        }
    }, [refreshPoints]);

    return (
        <UserContext.Provider value={{ user, role, points, login, logout, refreshPoints, updateAvatar }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
