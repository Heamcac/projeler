import { BadRequestException, Injectable } from "@nestjs/common";
import type { MoveArmyCommand } from "@imperium/shared";
import { factions, provinces } from "./seed-data";

@Injectable()
export class GameService {
  getFactions() {
    return factions;
  }

  getProvinces() {
    return provinces;
  }

  getPlayerState(factionId: string) {
    const faction = factions.find((item) => item.id === factionId);
    if (!faction) {
      throw new BadRequestException("Fraksiyon bulunamadı.");
    }

    return {
      faction,
      provinces: provinces.filter((province) => province.controllerFactionId === factionId),
      activeSieges: [
        {
          id: "siege-constantinople-1453",
          provinceId: "constantinople",
          attackerFactionId: "ottomans",
          defenderFactionId: "byzantium",
          progress: 22,
          defenderMorale: 0.72,
          foodSupply: 38,
          artilleryStrength: 84,
          navalBlockade: false,
        },
      ],
    };
  }

  queueMoveArmy(command: MoveArmyCommand) {
    const from = provinces.find((province) => province.id === command.fromProvinceId);
    if (!from || !from.neighbors.includes(command.toProvinceId)) {
      throw new BadRequestException("Ordu yalnızca komşu eyalete hareket edebilir.");
    }

    return {
      id: `move-${Date.now()}`,
      status: "accepted",
      ...command,
      estimatedSeconds: this.calculateTravelSeconds(from.terrain),
    };
  }

  private calculateTravelSeconds(terrain: string) {
    const terrainCost: Record<string, number> = {
      plains: 90,
      coastal: 110,
      urban: 130,
      forest: 150,
      hills: 170,
      mountains: 230,
      desert: 180,
    };
    return terrainCost[terrain] ?? 140;
  }
}
