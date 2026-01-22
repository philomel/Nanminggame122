
import { Prefecture, Official, Faction, TroopType, GameEvent } from './types.ts';

const generateTaxes = (base: number) => ({
  land: Math.floor(base * 0.7),
  salt: Math.floor(base * 0.08),
  merchant: Math.floor(base * 0.15),
  maritime: Math.floor(base * 0.03),
  misc: Math.floor(base * 0.04),
});

export const NAN_ZHILI_PREFECTURES_NAMES: string[] = [
  '应天府', '苏州府', '松江府', '扬州府', '常州府', 
  '镇江府', '淮安府', '凤阳府', '徽州府', '安庆府', 
  '太平府', '池州府', '庐州府', '宁国府', '徐州', 
  '广德州', '和州', '滁州'
];

export const INITIAL_PREFECTURES: Prefecture[] = NAN_ZHILI_PREFECTURES_NAMES.map((name, i) => ({
  id: `pref-${i}`,
  name,
  taxes: name === '苏州府' ? { land: 70, salt: 8, merchant: 15, maritime: 3, misc: 4 } : generateTaxes(70 + Math.floor(Math.random() * 30))
}));

export const COURT_OFFICIALS: Official[] = [
  { role: '首辅', name: '马士英', description: '掌控凤阳军权，拥立之功。' },
  { role: '吏部尚书', name: '张慎言', description: '老成持重，东林党领袖。' },
  { role: '户部尚书', name: '高弘图', description: '廉洁耿直，理财能臣。' },
  { role: '礼部尚书', name: '钱谦益', description: '江左三大家之首，士林领袖。' },
  { role: '兵部尚书', name: '史可法', description: '赤心报国，驻守扬州。' },
  { role: '刑部尚书', name: '解学龙', description: '执法严明，清流名臣。' },
  { role: '工部尚书', name: '何应瑞', description: '格物致知，负责修缮与火器。' },
];

export const FACTIONS: Faction[] = [
  { name: '清势力', status: '敌对', description: '满清八旗及吴三桂投诚军。' },
  { name: '高杰', status: '和平', description: '江北四镇之一，驻泗州。' },
  { name: '黄得功', status: '和平', description: '江北四镇之一，驻庐州。' },
  { name: '刘良佐', status: '和平', description: '江北四镇之一，驻临淮。' },
  { name: '刘泽清', status: '和平', description: '江北四镇之一，驻淮安。' },
  { name: '左良玉', status: '和平', description: '宁南侯，拥兵武昌。' },
];

export const GAME_EVENTS: GameEvent[] = [
  {
    id: 'EVENT_01',
    name: '福王南逃',
    triggerMonth: 5,
    background: '崇祯十七年五月，福王朱由崧在凤阳总督马士英护送下抵达浦口。朝中对此争论不休，是迎立福王，还是另择贤明？',
    options: [
      { 
        id: 'A', 
        text: '全礼迎立福王', 
        impactDesc: '银两-50, 声望+20, 马士英好感上升',
        impact: { silver: -50, prestige: 20 } 
      },
      { 
        id: 'B', 
        text: '暂缓入城，秘密磋商', 
        impactDesc: '声望-10, 历史进程减缓',
        impact: { prestige: -10 } 
      },
      { 
        id: 'C', 
        text: '联络史可法支持潞王', 
        impactDesc: '声望+30, 军事混乱风险增加',
        impact: { prestige: 30, military: -5000 } 
      }
    ]
  },
  {
    id: 'EVENT_02',
    name: '皇位继承人之争',
    triggerMonth: 6,
    background: '福王已入南京。但关于“立贤”还是“立亲”的争执达到顶峰。东林党坚持潞王更有贤名，而马士英已带兵逼近。',
    options: [
      { 
        id: 'A', 
        text: '接受现状，册封弘光帝', 
        impactDesc: '声望+10, 军事稳定',
        impact: { prestige: 10, silver: -100 } 
      },
      { 
        id: 'B', 
        text: '试图说服马士英退兵', 
        impactDesc: '成功率低, 军事风险高',
        impact: { military: -10000 } 
      },
      { 
        id: 'C', 
        text: '强行阻挠即位典礼', 
        impactDesc: '声望-50, 政权动荡',
        impact: { prestige: -50, silver: -200 } 
      }
    ]
  }
];
