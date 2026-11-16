export type Terrain =
  | "plains"
  | "hills"
  | "mountains"
  | "forest"
  | "coastal"
  | "urban"
  | "desert";

export type UnitType =
  | "infantry"
  | "archers"
  | "cavalry"
  | "heavy_cavalry"
  | "janissaries"
  | "artillery"
  | "galleys"
  | "transport_ships";

export interface Province {
  id: string;
  name: string;
  terrain: Terrain;
  ownerFactionId: string;
  controllerFactionId: string;
  population: number;
  taxIncome: number;
  foodProduction: number;
  manpower: number;
  fortLevel: number;
  portLevel: number;
  tradeValue: number;
  culture: string;
  religion: string;
  neighbors: string[];
  x: number;
  y: number;
}

export interface Faction {
  id: string;
  name: string;
  rulerName: string;
  governmentType: string;
  religion: string;
  cultureGroup: string;
  treasury: number;
  manpower: number;
  foodStockpile: number;
  stability: number;
  prestige: number;
  legitimacy: number;
  technologyLevel: number;
  diplomaticRelations: Record<string, number>;
}

export interface MoveArmyCommand {
  factionId: string;
  armyId: string;
  fromProvinceId: string;
  toProvinceId: string;
}
