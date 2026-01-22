
export enum TroopType {
  ACE = '王牌',
  ELITE = '精锐',
  VETERAN = '老兵',
  NEW = '新兵',
  LEVY = '壮丁'
}

export type PayScale = 1 | 0.7 | 0.3;

export interface TaxDetails {
  land: number;    // 田赋
  salt: number;    // 盐税
  merchant: number;// 商税
  maritime: number;// 海贸
  misc: number;    // 杂税
}

export interface Prefecture {
  id: string;
  name: string;
  taxes: TaxDetails;
}

export interface Official {
  role: string;
  name: string;
  description: string;
}

export interface Faction {
  name: string;
  status: '敌对' | '和平';
  description: string;
}

export interface EventOptionImpact {
  silver?: number;
  prestige?: number;
  military?: number;
  loyalty?: string; // 简化描述
}

export interface EventOption {
  id: string;
  text: string;
  impactDesc: string; // 显示给用户的描述
  impact: EventOptionImpact;
}

export interface GameEvent {
  id: string;
  name: string;
  triggerMonth: number;
  background: string;
  options: EventOption[];
}

export interface GameState {
  silver: number;
  prestige: number;
  infamy: number; // 恶名
  year: number;
  month: number;
  isPaused: boolean;
  prefectures: Prefecture[];
  military: Record<TroopType, number>;
  payScale: PayScale;
  history: string[];
  activeTab: '内政' | '科技' | '军事' | '财政' | '外交' | null;
  activeEvent: GameEvent | null;
  completedEventIds: string[];
}
