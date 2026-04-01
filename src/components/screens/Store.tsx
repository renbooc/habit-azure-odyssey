import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '@/src/context/UserContext';
import { API_URL } from '@/src/api_config';
import { Card } from '@/src/components/ui/Card';
import { ShoppingBag, Lightbulb, Gamepad2, BookOpen, Tv, Stars, Gift, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/src/components/ui/Input';
import { cn } from '@/src/lib/utils';

// Icon 映射表
const iconMap: Record<string, any> = {
  Gamepad2, BookOpen, Tv, Stars, ShoppingBag
};

interface StoreItem {
  id: string;
  name: string;
  price: number;
  icon: string;
  sub?: string;
  img?: string;
  comingSoon?: boolean;
}

interface StoreProps {
  userPoints?: number;
  role?: string;
  onPurchase?: () => void;
}

export const Store = ({ userPoints = 0, role = 'child', onPurchase }: StoreProps) => {
  const { user } = useUser();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('全部');
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(100);
  const [newItemIcon, setNewItemIcon] = useState('Gamepad2');

  const CATEGORIES = ['全部', '玩具', '零食', '书籍', '虚拟奖励'];

  const getItemCategory = (item: StoreItem): string => {
    const name = item.name || '';
    const icon = item.icon || '';
    if (name.includes('玩具') || icon === 'Gamepad2') return '玩具';
    if (name.includes('零食') || name.includes('吃') || name.includes('糖')) return '零食';
    if (name.includes('书') || icon === 'BookOpen') return '书籍';
    if (icon === 'Tv' || icon === 'Stars' || name.includes('分钟') || name.includes('动画') || name.includes('游乐园')) return '虚拟奖励';
    return '其他'; // Fallback
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_URL}/store/items?username=${user?.username}`);
      if (res.ok) {
        const data = await res.json();
        const enhancedData = data.map((item: any) => ({
          ...item,
          sub: item.sub || '通过努力获得的奖励，快来兑换吧！',
          img: item.img || null,
        }));
        setItems(enhancedData);
      }
    } catch (error) {
      console.error('获取商品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAddItem = async () => {
    if (!newItemName || newItemPrice <= 0) return;
    try {
      const res = await fetch(`${API_URL}/store/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItemName, price: newItemPrice, icon: newItemIcon })
      });
      if (res.ok) {
        setIsAdding(false);
        setNewItemName('');
        fetchItems();
        showToast('✅ 商品添加成功');
      }
    } catch (e) {
      console.error(e);
      showToast('❌ 添加失败');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm("确定删除这个奖励吗？")) return;
    try {
      const res = await fetch(`${API_URL}/store/items/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchItems();
        showToast('🗑️ 已删除商品');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || ShoppingBag;
    return <IconComponent size={80} className="text-white fill-current" />;
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Points Banner */}
      <section className="p-6 rounded-xl primary-gradient text-white shadow-lg overflow-hidden relative">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black mb-1">
              {role === 'parent' ? '商城管理' : '积分商城'}
            </h2>
            <p className="text-on-primary/90">
              {role === 'parent' ? '设置丰厚的奖品来激励孩子们吧！' : '赚取更多积分，兑换超赞奖励！'}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs uppercase tracking-wider font-bold opacity-70">
              {role === 'parent' ? '孩子当前积分' : '当前拥有'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-black italic">{userPoints}</span>
              <span className="text-lg font-bold">PTS</span>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-20 transform rotate-12">
          <ShoppingBag size={120} />
        </div>
      </section>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {CATEGORIES.map((cat, i) => (
          <button
            key={i}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all',
              activeCategory === cat ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-surface-container-high text-on-surface-variant/60 hover:bg-surface-variant'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Reward Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Parent Add Item Card */}
        {role === 'parent' && (
          <Card
            onClick={() => setIsAdding(true)}
            className="p-0 overflow-hidden flex flex-col group transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer border-3 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 h-full min-h-[16rem] items-center justify-center"
          >
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-4 shadow-sm">
              <Plus size={40} />
            </div>
            <h3 className="font-black text-xl text-primary mb-1">上架新商品</h3>
            <p className="text-sm text-primary/70 font-bold px-4 text-center">配置最具吸引力的全家奖励！</p>
          </Card>
        )}

        {loading ? (
          <p className="text-center text-on-surface-variant/60 py-10 col-span-1 sm:col-span-2 font-bold">仓库备货中...</p>
        ) : items.filter(item => activeCategory === '全部' || getItemCategory(item) === activeCategory).length === 0 ? (
          role !== 'parent' && <p className="text-center text-on-surface-variant/60 py-10 col-span-1 sm:col-span-2 font-bold">这一层的货柜空空的喔！</p>
        ) : items.filter(item => activeCategory === '全部' || getItemCategory(item) === activeCategory).map((item, i) => (
          <Card key={item.id || i} className="p-0 overflow-hidden flex flex-col group transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className={cn('relative h-48 w-full bg-surface-container-low flex items-center justify-center', 'bg-gradient-to-br from-indigo-500 to-purple-600')}>
              {item.img ? (
                <img src={item.img} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                renderIcon(item.icon)
              )}
              {item.comingSoon && (
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center backdrop-blur-sm">
                  <span className="bg-black/60 text-white px-4 py-2 rounded-full font-bold text-sm tracking-widest">敬请期待</span>
                </div>
              )}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-primary font-bold shadow-sm">
                  {item.price} 积分
                </span>
                {role === 'parent' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                    className="bg-red-500/90 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            <div className="p-5 flex flex-col flex-grow space-y-2">
              <h3 className="text-xl font-bold text-on-surface">{item.name}</h3>
              <p className="text-sm text-on-surface-variant/60 flex-grow">{item.sub}</p>

              {role === 'parent' ? (
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-full font-bold transition-all bg-surface-container-low text-on-surface-variant/60"
                >
                  <Stars size={16} className="inline mr-2" />
                  家长预览视角
                </button>
              ) : (
                <button
                  disabled={item.comingSoon || userPoints < item.price || purchasingId === item.id}
                  onClick={async () => {
                    if (userPoints >= item.price) {
                      setPurchasingId(item.id);
                      try {
                        const res = await fetch(`${API_URL}/store/purchase`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ item_id: item.id, price: item.price, username: user?.username })
                        });
                        if (res.ok) {
                          showToast('🎉 兑换成功！');
                          if (onPurchase) onPurchase(); // 刷新全局积分
                        } else {
                          showToast('❌ 兑换失败，请稍后重试');
                        }
                      } catch (e) {
                        console.error(e);
                        showToast('❌ 网络错误');
                      } finally {
                        setPurchasingId(null);
                      }
                    }
                  }}
                  className={cn(
                    'w-full py-3 px-4 rounded-full font-bold transition-all relative',
                    item.comingSoon ? 'bg-surface-container-low text-on-surface-variant/40' : (userPoints >= item.price ? 'bg-primary text-white hover:opacity-90 shadow-md' : 'bg-surface-container-low text-on-surface-variant/60 opacity-70 cursor-not-allowed')
                  )}
                >
                  <div className={cn("flex items-center justify-center gap-2", purchasingId === item.id ? "opacity-0" : "opacity-100")}>
                    {item.comingSoon ? '尚未开启' : (userPoints >= item.price ? '立即兑换' : '积分不足')}
                  </div>
                  {purchasingId === item.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                  )}
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Tips */}
      <section className="p-4 rounded-lg bg-surface-container-low border-l-4 border-primary">
        <h4 className="font-bold text-on-surface flex items-center gap-2 mb-1">
          <Lightbulb size={20} className="text-primary" />
          如何获得更多积分？
        </h4>
        <p className="text-sm text-on-surface-variant/60">完成每日健康习惯、阅读故事或帮爸爸妈妈分担家务都可以获得积分哦！</p>
      </section>

      {/* Central Celebration Modal */}
      <AnimatePresence>
        {toastMessage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
              transition={{ type: "spring", damping: 15 }}
              className="bg-surface relative rounded-[3rem] p-10 max-w-sm w-full shadow-2xl flex flex-col items-center text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-primary/10 pointer-events-none" />

              <div className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-primary/30 relative z-10">
                <Gift size={50} className="fill-current" />
              </div>

              <h2 className="text-3xl font-black text-on-surface mb-2 relative z-10">
                {toastMessage}
              </h2>

              <p className="text-on-surface-variant/80 font-bold mb-8 relative z-10">
                奖励已发放至你的背包！继续保持好习惯吧！
              </p>

              <button
                onClick={() => setToastMessage(null)}
                className="w-full bg-primary text-white py-4 rounded-full font-black text-lg hover:shadow-lg transition-all active:scale-95 relative z-10"
              >
                太棒了！
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Adding Modal for Parent */}
      <AnimatePresence>
        {isAdding && role === 'parent' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-surface rounded-3xl p-8 shadow-2xl relative z-10 space-y-8"
            >
              <div className="text-center">
                <h3 className="text-2xl font-black text-on-surface">添加新奖励商品</h3>
                <p className="text-on-surface-variant/60">为孩子配置一个极具吸引力的奖品吧！</p>
              </div>

              <div className="space-y-6">
                <Input
                  placeholder="如：半小时动画片时间 / 巧克力一盒..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                />

                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest ml-4 mb-2">需要消耗积分</p>
                    <Input
                      type="number"
                      placeholder="价格"
                      value={newItemPrice.toString()}
                      onChange={(e) => setNewItemPrice(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest ml-4">选择商品图标</p>
                  <div className="flex gap-4 justify-center">
                    {Object.keys(iconMap).map((iconKey) => {
                      const CurrentIcon = iconMap[iconKey];
                      return (
                        <button
                          key={iconKey}
                          onClick={() => setNewItemIcon(iconKey)}
                          className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                            newItemIcon === iconKey ? "bg-primary text-white scale-110 shadow-lg" : "bg-surface-container-high text-on-surface-variant"
                          )}
                        >
                          <CurrentIcon size={24} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button className="flex-1 font-bold py-3 rounded-full bg-surface-container hover:bg-surface-variant transition-colors" onClick={() => setIsAdding(false)}>取消</button>
                  <button className="flex-1 font-bold py-3 rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-50 transition-colors" onClick={handleAddItem} disabled={!newItemName || newItemPrice <= 0}>
                    上架商品
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
