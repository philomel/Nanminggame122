
import React, { useState, useEffect } from 'react';
import { 
  INITIAL_PREFECTURES, 
  SENIOR_GRAND_SECRETARY,
  SIX_MINISTRIES,
  MING_WARLORDS,
  QING_GENERALS,
  GAME_EVENTS
} from './constants.tsx';
import { 
  GameState, 
  TroopType, 
  PayScale,
  TaxDetails,
  EventOption
} from './types.ts';
import { 
  Shield, 
  Scroll, 
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
  Play,
  Pause,
  Skull,
  Users,
  Anchor,
  Hammer,
  Crown
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
        // 额外开支估算 (宗室、官俸等) - 简化模型: 约占军费的 50%
        const extraExpensesYearly = maintenanceYearly * 0.5;
        
        const expense = (maintenanceYearly + extraExpensesYearly) / 12;

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

  // 动态计算用于显示的财务数据
  const annualTax = gameState.prefectures.reduce((acc, p) => 
    acc + p.taxes.land + p.taxes.salt + p.taxes.merchant + p.taxes.maritime + p.taxes.misc, 0);
  const monthlyIncome = annualTax / 12;

  const totalMaintenanceYearly = (totalTroops * 15 * gameState.payScale) / 10000;
  // 假设分配：京营 30%，外镇 70%
  const capitalCampPayMonthly = (totalMaintenanceYearly * 0.3) / 12;
  const warlordSubsidiesMonthly = (totalMaintenanceYearly * 0.7) / 12;
  
  // 杂项固定开支 (单位: 万两/月)
  const civilSalariesMonthly = 0.8;
  const imperialClanMonthly = 1.5; // 明末宗室负担极重
  const courtExpensesMonthly = 0.5;
  const adminExpensesMonthly = 0.6;
  const reliefExpensesMonthly = 0.3;

  const totalMonthlyExpense = capitalCampPayMonthly + warlordSubsidiesMonthly + civilSalariesMonthly + imperialClanMonthly + courtExpensesMonthly + adminExpensesMonthly + reliefExpensesMonthly;


  return (
    <div className="flex h-screen bg-stone-900 text-stone-200 overflow-hidden font-serif">
      {/* 侧边菜单 */}
      <nav className="w-24 bg-stone-950 flex flex-col items-center py-8 space-y-10 border-r border-amber-900/30 z-30">
        <SidebarItem icon={<Shield />} label="内政" active={gameState.activeTab === '内政'} onClick={() => setGameState(p=>({...p, activeTab:'内政'}))} />
        <SidebarItem icon={<Scroll />} label="科技" active={gameState.activeTab === '科技'} onClick={() => setGameState(p=>({...p, activeTab:'科技'}))} />
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
            <Stat icon={<Coins className="text-yellow-600"/>} label="国库" value={`${gameState.silver.toFixed(2)}万`} />
            <Stat icon={<TrendingUp className="text-emerald-600"/>} label="声望" value={gameState.prestige} />
            <Stat icon={<Skull className="text-rose-700"/>} label="恶名" value={gameState.infamy} />
            <Stat icon={<Users className="text-blue-600"/>} label="兵力" value={`${(totalTroops / 10000).toFixed(1)}万`} />
            <Stat icon={<History className="text-amber-700"/>} label="纪元" value={`${gameState.year}年 ${gameState.month}月`} />
          </div>
        </div>

        {/* --- 功能 Overlay 窗口 --- */}

        {/* 1. 内政模块：皇帝在左，树状图在右 */}
        {gameState.activeTab === '内政' && (
          <Overlay title="朝廷内政" onClose={() => setGameState(p=>({...p, activeTab:null}))}>
            <div className="flex h-full gap-8">
              {/* 左侧：皇帝信息 */}
              <div className="w-1/3 flex flex-col items-center justify-center border-r border-amber-900/10 pr-6">
                <div className="p-8 bg-amber-50 rounded-2xl border-2 border-amber-900/20 text-center shadow-lg relative overflow-hidden group w-full max-w-sm">
                   <div className="absolute top-0 left-0 w-full h-2 bg-amber-800"></div>
                   <div className="w-32 h-32 bg-yellow-500/10 border-2 border-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <Crown size={64} className="text-yellow-700" />
                   </div>
                   <h3 className="text-3xl font-black text-amber-900 mb-2">弘光帝</h3>
                   <div className="text-xl font-bold text-amber-800 mb-4">朱由崧</div>
                   <p className="text-stone-600 italic leading-relaxed text-sm">
                      “大明天子，南都共主。”
                   </p>
                </div>
              </div>

              {/* 右侧：树状结构 */}
              <div className="w-2/3 flex flex-col items-center pt-8 relative">
                 {/* 首辅节点 */}
                 <div className="flex flex-col items-center mb-10 relative z-10">
                    <div className="w-16 h-16 bg-amber-900/20 border-2 border-amber-600 rounded-full flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(217,119,6,0.2)]">
                       <User size={32} className="text-amber-600" />
                    </div>
                    <div className="bg-amber-950 text-amber-100 px-6 py-2 rounded-lg border border-amber-700 font-black text-lg shadow-lg relative">
                       {SENIOR_GRAND_SECRETARY.name}
                       <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-700 text-[10px] px-2 py-0.5 rounded text-white whitespace-nowrap">
                          {SENIOR_GRAND_SECRETARY.role}
                       </div>
                    </div>
                    <div className="w-0.5 h-12 bg-amber-800/50 absolute top-full"></div>
                 </div>

                 {/* 连线与分支 */}
                 <div className="w-full relative">
                    <div className="absolute top-0 left-8 right-8 h-0.5 bg-amber-800/50"></div>
                    <div className="absolute top-0 left-8 h-8 w-0.5 bg-amber-800/50"></div>
                    <div className="absolute top-0 right-8 h-8 w-0.5 bg-amber-800/50"></div>

                    <div className="grid grid-cols-2 gap-16 pt-8">
                       {/* 左三部 */}
                       <div className="flex flex-col space-y-4">
                          {SIX_MINISTRIES.slice(0, 3).map(off => (
                            <div key={off.role} className="flex items-center bg-white/50 p-3 rounded-xl border border-amber-900/10 hover:bg-white hover:border-amber-600 transition-all shadow-sm">
                               <div className="w-8 h-8 bg-amber-800 rounded flex items-center justify-center text-white font-bold mr-3 shrink-0 text-xs">
                                  {off.role[0]}
                               </div>
                               <div>
                                  <div className="font-bold text-stone-800 text-sm">{off.role} · {off.name}</div>
                               </div>
                            </div>
                          ))}
                       </div>

                       {/* 右三部 */}
                       <div className="flex flex-col space-y-4">
                          {SIX_MINISTRIES.slice(3, 6).map(off => (
                            <div key={off.role} className="flex items-center bg-white/50 p-3 rounded-xl border border-amber-900/10 hover:bg-white hover:border-amber-600 transition-all shadow-sm">
                               <div className="w-8 h-8 bg-stone-800 rounded flex items-center justify-center text-white font-bold mr-3 shrink-0 text-xs">
                                  {off.role[0]}
                               </div>
                               <div>
                                  <div className="font-bold text-stone-800 text-sm">{off.role} · {off.name}</div>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </Overlay>
        )}

        {/* 2. 科技模块：改名与内容实装 */}
        {gameState.activeTab === '科技' && (
          <Overlay title="治国方略" onClose={() => setGameState(p=>({...p, activeTab:null}))}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: "练兵实纪", icon: <Sword />, desc: "重整营伍，提升新军战斗力", cost: "5000两" },
                { name: "盐法考成", icon: <Coins />, desc: "整顿两淮盐政，增加盐税收入", cost: "8000两" },
                { name: "泰西火器", icon: <Hammer />, desc: "引进红夷大炮铸造技术", cost: "12000两" },
                { name: "漕运整顿", icon: <Anchor />, desc: "疏通运河，降低运输损耗", cost: "6000两" },
                { name: "保甲连坐", icon: <Shield />, desc: "加强地方治安，减少民变", cost: "3000两" },
              ].map((tech, i) => (
                <div key={i} className="bg-white/40 border border-amber-900/10 p-6 rounded-xl hover:bg-white hover:shadow-lg transition-all cursor-pointer group">
                   <div className="flex items-center justify-between mb-4">
                      <div className="bg-stone-800 text-amber-500 p-3 rounded-lg group-hover:scale-110 transition-transform">{tech.icon}</div>
                      <span className="text-xs font-bold text-stone-400 bg-stone-100 px-2 py-1 rounded">{tech.cost}</span>
                   </div>
                   <h3 className="font-black text-amber-900 text-lg mb-2">{tech.name}</h3>
                   <p className="text-sm text-stone-600 leading-relaxed">{tech.desc}</p>
                </div>
              ))}
            </div>
          </Overlay>
        )}

        {/* 3. 军事模块：保持不变 */}
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

        {/* 4. 财政模块：左右分栏，详细收支 */}
        {gameState.activeTab === '财政' && (
          <Overlay title="朝廷财政" onClose={() => setGameState(p=>({...p, activeTab:null}))}>
             {/* 顶部军饷调节 */}
            <div className="mb-6 flex justify-between items-center bg-amber-50 p-4 rounded-xl border border-amber-200">
               <span className="font-bold text-amber-900">军饷发放比例</span>
               <div className="flex gap-2">
                {[1, 0.7, 0.3].map(scale => (
                  <button 
                    key={scale}
                    onClick={() => setGameState(p => ({...p, payScale: scale as PayScale}))}
                    className={`px-4 py-1 rounded text-sm font-bold transition-all ${gameState.payScale === scale ? 'bg-amber-800 text-white' : 'bg-white text-stone-500 border border-stone-300'}`}
                  >
                    {scale === 1 ? '全额' : scale === 0.7 ? '七成' : '三成'}
                  </button>
                ))}
               </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 h-[500px]">
               {/* 左侧：岁入（各府税赋） */}
               <div className="flex-1 flex flex-col bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="p-4 bg-stone-100 border-b border-stone-200 flex justify-between items-center">
                     <h3 className="font-black text-stone-700">各府税赋 (岁入)</h3>
                     <span className="text-emerald-700 font-mono font-bold">+{monthlyIncome.toFixed(2)}万/月</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 scroll-hide">
                     <div className="grid grid-cols-1 gap-2">
                        {gameState.prefectures.map(p => (
                           <div key={p.id} className="flex items-center justify-between p-2 hover:bg-amber-50 rounded border-b border-stone-100 last:border-0">
                              <span className="text-xs font-bold text-stone-800 w-16">{p.name}</span>
                              <div className="flex-1 flex gap-2 justify-end">
                                 <TaxMiniDisplay label="田" val={p.taxes.land} />
                                 <TaxMiniDisplay label="盐" val={p.taxes.salt} />
                                 <TaxMiniDisplay label="商" val={p.taxes.merchant} />
                                 <TaxMiniDisplay label="海" val={p.taxes.maritime} />
                                 <TaxMiniDisplay label="杂" val={p.taxes.misc} />
                              </div>
                              <button onClick={() => updatePrefectureTax(p.id, 'land', p.taxes.land + 1)} className="ml-2 text-stone-300 hover:text-amber-600 px-1">+</button>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* 右侧：岁出（详细开支） */}
               <div className="w-full md:w-1/3 bg-stone-50 rounded-xl border border-stone-200 shadow-sm flex flex-col">
                  <div className="p-4 bg-rose-50 border-b border-rose-100 flex justify-between items-center">
                     <h3 className="font-black text-rose-900">国库岁出</h3>
                     <span className="text-rose-700 font-mono font-bold">-{totalMonthlyExpense.toFixed(2)}万/月</span>
                  </div>
                  <div className="p-6 space-y-4">
                     <ExpenseItem label="南京京营军饷" val={capitalCampPayMonthly} />
                     <ExpenseItem label="外镇驻军协饷" val={warlordSubsidiesMonthly} sub="江北四镇及左部" />
                     <div className="h-px bg-stone-200 my-2"></div>
                     <ExpenseItem label="文官俸禄" val={civilSalariesMonthly} />
                     <ExpenseItem label="宗室禄米" val={imperialClanMonthly} highlight />
                     <ExpenseItem label="宫廷用度" val={courtExpensesMonthly} />
                     <ExpenseItem label="行政开支" val={adminExpensesMonthly} />
                     <ExpenseItem label="工程与赈灾" val={reliefExpensesMonthly} />
                     
                     <div className="mt-8 pt-4 border-t-2 border-stone-200 flex justify-between items-end">
                        <span className="font-black text-stone-600">月度收支净额</span>
                        <span className={`text-2xl font-mono font-black ${monthlyIncome - totalMonthlyExpense >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {monthlyIncome - totalMonthlyExpense >= 0 ? '+' : ''}{(monthlyIncome - totalMonthlyExpense).toFixed(2)}万
                        </span>
                     </div>
                  </div>
               </div>
            </div>
          </Overlay>
        )}

        {/* 5. 外交模块：统一为双列树状列表 */}
        {gameState.activeTab === '外交' && (
          <Overlay title="外部局势" onClose={() => setGameState(p=>({...p, activeTab:null}))}>
             <div className="flex justify-between items-start h-full pt-6 relative">
                {/* 中间分割线 */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-stone-300 border-l border-dashed border-stone-400"></div>

                {/* 左侧：大明军镇 (双列树状) */}
                <div className="w-1/2 pr-12 flex flex-col items-center">
                   <h3 className="text-xl font-black text-amber-900 mb-8 flex items-center"><Shield className="mr-2"/> 南京朝廷与各镇</h3>
                   
                   {/* 玩家节点 */}
                   <div className="bg-amber-900 text-white px-6 py-3 rounded-lg shadow-lg font-bold mb-10 z-10">
                      弘光朝廷 (你)
                   </div>

                   {/* 军阀列表 (双列树状) */}
                   <div className="w-full relative">
                      {/* 连接线 */}
                      <div className="absolute left-1/2 -top-10 h-6 w-0.5 bg-amber-900/20 -translate-x-1/2"></div>
                      <div className="absolute top-[-16px] left-8 right-8 h-0.5 bg-amber-900/20"></div>
                      <div className="absolute top-[-16px] left-8 h-6 w-0.5 bg-amber-900/20"></div>
                      <div className="absolute top-[-16px] right-8 h-6 w-0.5 bg-amber-900/20"></div>
                      
                      <div className="grid grid-cols-2 gap-8 pt-2">
                          <div className="space-y-4">
                             {MING_WARLORDS.slice(0, 3).map((w, i) => (
                               <div key={i} className="relative flex items-center justify-between bg-white p-3 rounded-xl border-l-4 border-l-emerald-600 shadow-sm hover:shadow-md transition-all">
                                  <div>
                                     <div className="font-bold text-stone-800 text-sm">{w.name}</div>
                                     <div className="text-[10px] text-stone-500">{w.loc} · {w.troops}</div>
                                  </div>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800`}>
                                     {w.status}
                                  </span>
                               </div>
                             ))}
                          </div>
                          <div className="space-y-4">
                             {MING_WARLORDS.slice(3).map((w, i) => (
                               <div key={i} className="relative flex items-center justify-between bg-white p-3 rounded-xl border-l-4 border-l-emerald-600 shadow-sm hover:shadow-md transition-all">
                                  <div>
                                     <div className="font-bold text-stone-800 text-sm">{w.name}</div>
                                     <div className="text-[10px] text-stone-500">{w.loc} · {w.troops}</div>
                                  </div>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800`}>
                                     {w.status}
                                  </span>
                               </div>
                             ))}
                          </div>
                      </div>
                   </div>
                </div>

                {/* 右侧：满清势力 (双列树状) */}
                <div className="w-1/2 pl-12 flex flex-col items-center">
                   <h3 className="text-xl font-black text-rose-900 mb-8 flex items-center">满清势力 <Sword className="ml-2"/></h3>
                   
                   {/* 敌对核心 */}
                   <div className="bg-stone-800 text-white px-6 py-3 rounded-lg shadow-lg font-bold mb-10 z-10 border-2 border-stone-600">
                      满清摄政王 · 多尔衮
                   </div>

                   {/* 清军将领列表 (双列树状) */}
                   <div className="w-full relative">
                      {/* 连接线 */}
                      <div className="absolute left-1/2 -top-10 h-6 w-0.5 bg-stone-800/20 -translate-x-1/2"></div>
                      <div className="absolute top-[-16px] left-8 right-8 h-0.5 bg-stone-800/20"></div>
                      <div className="absolute top-[-16px] left-8 h-6 w-0.5 bg-stone-800/20"></div>
                      <div className="absolute top-[-16px] right-8 h-6 w-0.5 bg-stone-800/20"></div>

                      <div className="grid grid-cols-2 gap-8 pt-2">
                          <div className="space-y-4">
                             {QING_GENERALS.slice(0, 2).map((g, i) => (
                               <div key={i} className="relative flex items-center justify-between bg-stone-100 p-3 rounded-xl border-r-4 border-r-rose-800 shadow-sm hover:shadow-md transition-all">
                                  <div className="text-left">
                                     <div className="font-bold text-stone-800 text-sm">{g.name}</div>
                                     <div className="text-[10px] text-stone-500">{g.title}</div>
                                  </div>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-800 text-white">
                                     {g.status}
                                  </span>
                               </div>
                             ))}
                          </div>
                          <div className="space-y-4">
                             {QING_GENERALS.slice(2).map((g, i) => (
                               <div key={i} className="relative flex items-center justify-between bg-stone-100 p-3 rounded-xl border-r-4 border-r-rose-800 shadow-sm hover:shadow-md transition-all">
                                  <div className="text-left">
                                     <div className="font-bold text-stone-800 text-sm">{g.name}</div>
                                     <div className="text-[10px] text-stone-500">{g.title}</div>
                                  </div>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-800 text-white">
                                     {g.status}
                                  </span>
                               </div>
                             ))}
                          </div>
                      </div>
                   </div>
                </div>
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
    <div className="flex justify-between items-center mb-6 border-b-4 border-double border-amber-900/30 pb-4">
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

const TaxMiniDisplay: React.FC<{label: string, val: number}> = ({label, val}) => (
  <div className="flex flex-col items-center w-8">
     <span className="text-[8px] text-stone-400 scale-75 origin-bottom">{label}</span>
     <span className="text-xs font-mono text-stone-600 font-bold">{val}</span>
  </div>
);

const ExpenseItem: React.FC<{label: string, val: number, sub?: string, highlight?: boolean}> = ({label, val, sub, highlight}) => (
   <div className={`flex justify-between items-center ${highlight ? 'text-rose-800' : 'text-stone-700'}`}>
      <div>
         <div className={`font-bold ${highlight ? 'text-sm' : 'text-xs'}`}>{label}</div>
         {sub && <div className="text-[10px] text-stone-400">{sub}</div>}
      </div>
      <span className="font-mono font-bold">{val.toFixed(2)}万</span>
   </div>
);

export default App;
