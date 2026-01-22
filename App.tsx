
import React, { useState, useEffect } from 'react';
import { 
  INITIAL_PREFECTURES, 
  COURT_OFFICIALS, 
  FACTIONS,
  GAME_EVENTS
} from './constants.tsx';
import { 
  GameState, 
  TroopType, 
  PayScale,
  Prefecture,
  TaxDetails,
  GameEvent,
  EventOption
} from './types.ts';
import { 
  Shield, 
  FlaskConical, 
  Sword, 
  Landmark, 
  Globe, 
  X,
  History,
  TrendingUp,
  Coins,
  ChevronRight,
  User,
  AlertTriangle,
  Map as MapIcon,
  Play,
  Pause,
  Skull,
  Users
} from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    silver: 20, // 20万两
    prestige: 200,
    infamy: 10,
    year: 1644,
    month: 4,
    isPaused: true,
    prefectures: INITIAL_PREFECTURES,
    military: {
      [TroopType.ACE]: 1000,
      [TroopType.ELITE]: 4000,
      [TroopType.VETERAN]: 10000,
      [TroopType.NEW]: 25000,
      [TroopType.LEVY]: 40000
      // 总计 80,000
    },
    payScale: 1,
    history: ['甲申国难，大明在南方余晖中艰难求生。'],
    activeTab: null,
    activeEvent: null,
    completedEventIds: []
  });

  const [recruitModal, setRecruitModal] = useState<{ isOpen: boolean; amount: number; isFirearm: boolean } | null>(null);

  // 时钟与逻辑循环
  useEffect(() => {
    if (gameState.isPaused || gameState.activeEvent) return;

    const timer = setInterval(() => {
      setGameState(prev => {
        let nextMonth = prev.month + 1;
        let nextYear = prev.year;
        if (nextMonth > 12) {
          nextMonth = 1;
          nextYear += 1;
        }

        // 财务结算（月度）
        const totalTaxYearly = prev.prefectures.reduce((acc, p) => 
          acc + p.taxes.land + p.taxes.salt + p.taxes.merchant + p.taxes.maritime + p.taxes.misc, 0);
        const income = totalTaxYearly / 12;

        const totalTroops = (Object.values(prev.military) as number[]).reduce((a, b) => a + b, 0);
        // 维持费: 15两/人/年。 换算为万两: (人数 * 15) / 10000
        const maintenanceYearly = (totalTroops * 15 * prev.payScale) / 10000;
        const expense = maintenanceYearly / 12;

        const nextSilver = prev.silver + income - expense;

        // 事件触发
        let nextActiveEvent = prev.activeEvent;
        if (!nextActiveEvent) {
          const possibleEvent = GAME_EVENTS.find(e => 
            !prev.completedEventIds.includes(e.id) && 
            (nextYear > 1644 || (nextYear === 1644 && nextMonth >= e.triggerMonth))
          );
          if (possibleEvent) nextActiveEvent = possibleEvent;
        }

        return {
          ...prev,
          month: nextMonth,
          year: nextYear,
          silver: nextSilver,
          activeEvent: nextActiveEvent
        };
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [gameState.isPaused, gameState.activeEvent, gameState.completedEventIds]);

  const handleEventChoice = (option: EventOption) => {
    if (!gameState.activeEvent) return;
    const impact = option.impact;
    
    setGameState(prev => ({
      ...prev,
      silver: prev.silver + (impact.silver || 0),
      prestige: prev.prestige + (impact.prestige || 0),
      military: {
        ...prev.military,
        [TroopType.NEW]: prev.military[TroopType.NEW] + (impact.military || 0)
      },
      history: [...prev.history, `[${prev.activeEvent?.name}] 选择了：${option.text}`],
      completedEventIds: [...prev.completedEventIds, prev.activeEvent!.id],
      activeEvent: null,
      isPaused: false
    }));
  };

  const updatePrefectureTax = (id: string, field: keyof TaxDetails, val: number) => {
    setGameState(prev => ({
      ...prev,
      prefectures: prev.prefectures.map(p => 
        p.id === id ? { ...p, taxes: { ...p.taxes, [field]: Math.max(0, val) } } : p
      )
    }));
  };

  const handleRecruit = () => {
    if (!recruitModal) return;
    // 招募费假设为 2两/人，即 0.0002万两/人
    const cost = (recruitModal.amount * 2) / 10000; 
    if (gameState.silver < cost) {
      alert("国库空虚，不足以支应招募费！");
      return;
    }
    setGameState(prev => ({
      ...prev,
      silver: prev.silver - cost,
      military: {
        ...prev.military,
        [TroopType.NEW]: prev.military[TroopType.NEW] + recruitModal.amount
      },
      history: [...prev.history, `征募了 ${recruitModal.amount} 名新兵。`]
    }));
    setRecruitModal(null);
  };

  const totalTroops = (Object.values(gameState.military) as number[]).reduce((a, b) => a + b, 0);

  return (
    <div className="flex h-screen bg-stone-900 text-stone-200 overflow-hidden font-serif">
      {/* 侧边菜单 */}
      <nav className="w-24 bg-stone-950 flex flex-col items-center py-8 space-y-10 border-r border-amber-900/30 z-30">
        <SidebarItem icon={<Shield />} label="内政" active={gameState.activeTab === '内政'} onClick={() => setGameState(p=>({...p, activeTab:'内政'}))} />
        <SidebarItem icon={<FlaskConical />} label="科技" active={gameState.activeTab === '科技'} onClick={() => setGameState(p=>({...p, activeTab:'科技'}))} />
        <SidebarItem icon={<Sword />} label="军事" active={gameState.activeTab === '军事'} onClick={() => setGameState(p=>({...p, activeTab:'军事'}))} />
        <SidebarItem icon={<Landmark />} label="财政" active={gameState.activeTab === '财政'} onClick={() => setGameState(p=>({...p, activeTab:'财政'}))} />
        <SidebarItem icon={<Globe />} label="外交" active={gameState.activeTab === '外交'} onClick={() => setGameState(p=>({...p, activeTab:'外交'}))} />
        
        <div className="mt-auto flex flex-col items-center space-y-4">
           <button 
             onClick={() => setGameState(p => ({...p, isPaused: !p.isPaused}))} 
             className={`p-3 rounded-full shadow-lg transition-transform hover:scale-110 ${gameState.isPaused ? 'bg-emerald-800' : 'bg-rose-900'}`}
           >
             {gameState.isPaused ? <Play size={20} /> : <Pause size={20} />}
           </button>
        </div>
      </nav>

      {/* 主展示区 */}
      <main className="flex-1 relative overflow-hidden bg-stone-900">
        {/* 背景装饰地图 */}
        <div className="absolute inset-0 opacity-40 pointer-events-none flex items-center justify-center">
           <svg className="w-full h-full p-10" viewBox="0 0 1000 700">
             <path d="M200,100 Q300,50 450,150 T700,250 T900,400 T800,600 T500,650 T200,500 Z" fill="none" stroke="#8b4513" strokeWidth="2" strokeDasharray="5,5" />
             <text x="500" y="350" fill="#8b4513" fontSize="80" opacity="0.3" textAnchor="middle" style={{fontFamily: 'Noto Serif SC'}}>南直隶全境</text>
             <circle cx="500" cy="400" r="10" fill="#8b4513" opacity="0.5" />
             <text x="515" y="405" fill="#8b4513" fontSize="14" opacity="0.5">南京</text>
           </svg>
        </div>

        {/* 顶部HUD */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
          <div className="bg-stone-950/90 backdrop-blur border border-amber-900/40 px-6 py-4 rounded-xl shadow-2xl flex space-x-10">
            <Stat icon={<Coins className="text-yellow-600"/>} label="国库" value={`${gameState.silver.toFixed(1)}万两`} />
            <Stat icon={<TrendingUp className="text-emerald-600"/>} label="声望" value={gameState.prestige} />
            <Stat icon={<Skull className="text-rose-700"/>} label="恶名" value={gameState.infamy} />
            <Stat icon={<Users className="text-blue-600"/>} label="兵力" value={`${(totalTroops / 10000).toFixed(1)}万`} />
            <Stat icon={<History className="text-amber-700"/>} label="纪元" value={`${gameState.year}年 ${gameState.month}月`} />
          </div>
        </div>

        {/* 功能 Overlay 窗口 */}
        {gameState.activeTab === '内政' && (
          <Overlay title="朝廷内政" onClose={() => setGameState(p=>({...p, activeTab:null}))}>
            <div className="flex flex-col md:flex-row gap-10">
              <div className="w-full md:w-1/3 bg-amber-900/5 p-8 rounded-2xl border border-amber-900/10 text-center">
                <div className="w-32 h-32 bg-stone-300 rounded-full mx-auto mb-6 border-4 border-amber-900/20 flex items-center justify-center overflow-hidden">
                   <User size={80} className="text-stone-500" />
                </div>
                <h3 className="text-3xl font-black text-amber-900">弘光帝 · 朱由崧</h3>
                <p className="text-stone-600 mt-4 leading-relaxed italic text-sm">
                  “甲申之变后，于南京被拥立为帝。虽非亡国之君，却处亡国之时。”
                </p>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-amber-900 mb-6 border-b border-amber-900/20 pb-2">内阁与六部</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {COURT_OFFICIALS.map(off => (
                    <div key={off.role} className="flex items-center space-x-4 p-4 bg-white shadow-sm border border-stone-200 rounded-lg hover:border-amber-700 transition-colors">
                      <div className="w-12 h-12 bg-amber-800 text-white rounded-md flex items-center justify-center font-bold text-xs p-1 text-center leading-tight">
                        {off.role}
                      </div>
                      <div>
                        <div className="font-black text-stone-800 text-lg">{off.name}</div>
                        <div className="text-[10px] text-stone-400">{off.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Overlay>
        )}

        {gameState.activeTab === '科技' && (
          <Overlay title="格物科技" onClose={() => setGameState(p=>({...p, activeTab:null}))}>
            <div className="py-32 text-center">
              <FlaskConical size={64} className="mx-auto text-stone-300 mb-6" />
              <h3 className="text-2xl font-black text-stone-400">科技树系统编纂中...</h3>
              <p className="text-stone-500 mt-2">包含火器改良、屯田法优化等模块。</p>
            </div>
          </Overlay>
        )}

        {gameState.activeTab === '军事' && (
          <Overlay title="五军都督府" onClose={() => setGameState(p=>({...p, activeTab:null}))}>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
              {Object.entries(gameState.military).map(([type, count]) => (
                <div key={type} className="bg-stone-800 p-6 rounded-2xl border border-amber-900/30 text-center shadow-xl">
                  <div className="text-amber-500 text-xs font-bold mb-1 uppercase tracking-tighter">{type}</div>
                  <div className="text-3xl font-black text-white">{count.toLocaleString()}</div>
                  <div className="text-[10px] text-stone-500 mt-2">维持: 15两/人/年</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              <button 
                onClick={() => setRecruitModal({ isOpen: true, amount: 5000, isFirearm: false })}
                className="flex-1 bg-amber-800 hover:bg-amber-700 text-white font-black py-5 rounded-xl shadow-xl transition-all flex items-center justify-center"
              >
                <Sword size={20} className="mr-3" /> 征募普通兵
              </button>
              <button className="flex-1 bg-stone-700 text-stone-500 font-black py-5 rounded-xl cursor-not-allowed flex items-center justify-center border-2 border-stone-800">
                <AlertTriangle size={20} className="mr-3" /> 征募火枪兵 (尚未解锁)
              </button>
            </div>
          </Overlay>
        )}

        {gameState.activeTab === '财政' && (
          <Overlay title="户部奏议" onClose={() => setGameState(p=>({...p, activeTab:null}))}>
            <div className="mb-8 p-6 bg-amber-900/5 rounded-2xl border border-amber-900/10">
              <h4 className="font-black text-amber-900 mb-4 flex items-center"><Sword size={18} className="mr-2" /> 军饷比例</h4>
              <div className="flex gap-4">
                {[1, 0.7, 0.3].map(scale => (
                  <button 
                    key={scale}
                    onClick={() => setGameState(p => ({...p, payScale: scale as PayScale}))}
                    className={`flex-1 py-3 rounded-lg font-bold border-2 transition-all ${gameState.payScale === scale ? 'bg-amber-800 text-white border-amber-900' : 'bg-white text-stone-600 border-stone-200'}`}
                  >
                    {scale === 1 ? '满饷' : scale === 0.7 ? '7成饷' : '3成饷'}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[450px] overflow-y-auto pr-4 scroll-hide space-y-4">
              {gameState.prefectures.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-center mb-6 border-b pb-2">
                    <span className="text-2xl font-black text-stone-800">{p.name}</span>
                    <span className="text-amber-800 font-mono font-bold text-xl">岁入: {Object.values(p.taxes).reduce((a:number, b:number) => a + b, 0)}w</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <TaxInput label="田赋" value={p.taxes.land} onChange={(v) => updatePrefectureTax(p.id, 'land', v)} />
                    <TaxInput label="盐税" value={p.taxes.salt} onChange={(v) => updatePrefectureTax(p.id, 'salt', v)} />
                    <TaxInput label="商税" value={p.taxes.merchant} onChange={(v) => updatePrefectureTax(p.id, 'merchant', v)} />
                    <TaxInput label="海贸" value={p.taxes.maritime} onChange={(v) => updatePrefectureTax(p.id, 'maritime', v)} />
                    <TaxInput label="杂税" value={p.taxes.misc} onChange={(v) => updatePrefectureTax(p.id, 'misc', v)} />
                  </div>
                </div>
              ))}
            </div>
          </Overlay>
        )}

        {gameState.activeTab === '外交' && (
          <Overlay title="外交关系" onClose={() => setGameState(p=>({...p, activeTab:null}))}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {FACTIONS.map(f => (
                  <div key={f.name} className="bg-white/90 p-6 rounded-2xl border border-stone-200 shadow-sm flex justify-between items-center group hover:border-amber-800 transition-colors">
                     <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h4 className="text-2xl font-black text-stone-900">{f.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${f.status === '敌对' ? 'bg-rose-800 text-white' : 'bg-emerald-800 text-white'}`}>
                            {f.status}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 italic">{f.description}</p>
                     </div>
                     <ChevronRight className="text-stone-300 group-hover:text-amber-800" />
                  </div>
                ))}
             </div>
          </Overlay>
        )}
      </main>

      {/* 右侧边栏 */}
      <aside className="w-80 bg-stone-950 p-6 border-l border-amber-900/30 flex flex-col z-20">
        <h2 className="text-amber-600 font-black text-lg mb-8 flex items-center tracking-widest border-b border-amber-900/30 pb-4">
          <History className="mr-3 w-5 h-5" /> 大事纪要
        </h2>
        <div className="flex-1 overflow-y-auto space-y-5 scroll-hide">
          {gameState.history.slice().reverse().map((h, i) => (
            <div key={i} className="text-stone-400 text-xs leading-relaxed border-l-2 border-amber-900/50 pl-4 py-2 bg-white/5 rounded-r-lg italic">
              {h}
            </div>
          ))}
        </div>
      </aside>

      {/* 事件弹出框 */}
      {gameState.activeEvent && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-6">
          <div className="parchment-bg chinese-border max-w-2xl w-full p-12 shadow-[0_0_100px_rgba(139,69,19,0.3)]">
            <h2 className="text-4xl font-black text-amber-950 mb-6 border-b-2 border-amber-900/30 pb-4 flex items-center">
              <AlertTriangle className="mr-4 text-rose-800" /> {gameState.activeEvent.name}
            </h2>
            <p className="text-xl text-stone-800 leading-relaxed mb-10 first-letter:text-4xl first-letter:font-bold first-letter:mr-1">
              {gameState.activeEvent.background}
            </p>
            <div className="space-y-4">
              {gameState.activeEvent.options.map(opt => (
                <button 
                  key={opt.id}
                  onClick={() => handleEventChoice(opt)}
                  className="w-full text-left bg-white/50 hover:bg-amber-100 border-2 border-amber-900/10 hover:border-amber-900 p-6 rounded-xl transition-all group"
                >
                   <div className="flex justify-between items-center mb-2">
                     <span className="font-black text-amber-900 text-lg">{opt.text}</span>
                     <span className="text-xs text-stone-400">选项 {opt.id}</span>
                   </div>
                   <p className="text-sm text-stone-600 font-bold border-t border-amber-900/5 pt-2 italic">
                     后果预览：{opt.impactDesc}
                   </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 征兵滑动框 */}
      {recruitModal && (
        <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-6">
          <div className="parchment-bg chinese-border max-w-md w-full p-10">
            <h3 className="text-3xl font-black text-amber-950 mb-8 border-b border-amber-900/20 pb-4">征募大明卫所</h3>
            <div className="space-y-8">
              <div>
                <div className="flex justify-between text-sm font-bold text-stone-700 mb-4">
                  <span>拟征召数量</span>
                  <span className="text-amber-900 text-xl font-black">{recruitModal.amount.toLocaleString()} 名</span>
                </div>
                <input 
                  type="range" min="1000" max="100000" step="1000"
                  value={recruitModal.amount}
                  onChange={(e) => setRecruitModal({...recruitModal, amount: parseInt(e.target.value)})}
                  className="w-full h-2 bg-stone-300 rounded-lg appearance-none cursor-pointer accent-amber-900"
                />
              </div>
              <div className="flex justify-between items-center bg-amber-900/10 p-5 rounded-xl border border-amber-900/20">
                <span className="text-stone-700 font-bold">预计一次性费用</span>
                <span className="text-2xl font-black text-amber-900">{((recruitModal.amount * 2) / 10000).toFixed(2)} 万两</span>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setRecruitModal(null)} className="flex-1 py-4 bg-stone-200 text-stone-700 font-bold rounded-lg hover:bg-stone-300">罢兵</button>
                <button onClick={handleRecruit} className="flex-1 py-4 bg-amber-900 text-white font-bold rounded-lg shadow-xl hover:bg-amber-800">下旨征兵</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 子组件 ---

const SidebarItem: React.FC<{icon: React.ReactNode, label: string, active: boolean, onClick: () => void}> = ({icon, label, active, onClick}) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center group transition-all ${active ? 'text-amber-500 scale-110' : 'text-stone-500 hover:text-stone-300'}`}
  >
    <div className={`p-4 rounded-2xl mb-2 shadow-lg transition-colors ${active ? 'bg-amber-900/20 border border-amber-500/30' : 'bg-stone-900/50'}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { size: 30 })}
    </div>
    <span className="text-[10px] font-black tracking-widest">{label}</span>
  </button>
);

const Stat: React.FC<{icon: React.ReactNode, label: string, value: string | number}> = ({icon, label, value}) => (
  <div className="flex items-center space-x-4">
    <div className="p-2 bg-stone-900/50 rounded-lg">{icon}</div>
    <div>
      <div className="text-[10px] text-stone-500 font-bold uppercase tracking-widest leading-none mb-1">{label}</div>
      <div className="text-lg font-black text-amber-100 leading-none">{value}</div>
    </div>
  </div>
);

const Overlay: React.FC<{title: string, children: React.ReactNode, onClose: () => void}> = ({title, children, onClose}) => (
  <div className="absolute inset-8 top-28 bottom-8 parchment-bg chinese-border p-12 z-20 flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300">
    <div className="flex justify-between items-center mb-10 border-b-4 border-double border-amber-900/30 pb-4">
      <h2 className="text-4xl font-black text-amber-950 tracking-[0.2em]">{title}</h2>
      <button onClick={onClose} className="p-3 hover:bg-amber-900/10 rounded-full transition-colors text-amber-950">
        <X size={36} />
      </button>
    </div>
    <div className="flex-1 overflow-y-auto pr-4 scroll-hide">
      {children}
    </div>
  </div>
);

const TaxInput: React.FC<{label: string, value: number, onChange: (v: number) => void}> = ({label, value, onChange}) => (
  <div className="flex flex-col items-center bg-stone-100 p-3 rounded-lg border border-stone-200">
    <span className="text-[11px] font-black text-stone-500 mb-2">{label}</span>
    <div className="flex items-center space-x-3">
      <button onClick={() => onChange(value - 1)} className="w-6 h-6 bg-stone-200 rounded text-xs hover:bg-stone-300 transition-colors">-</button>
      <span className="font-mono font-black text-stone-900 text-lg">{value}</span>
      <button onClick={() => onChange(value + 1)} className="w-6 h-6 bg-stone-200 rounded text-xs hover:bg-stone-300 transition-colors">+</button>
    </div>
  </div>
);

export default App;
