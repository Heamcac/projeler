import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import type { MoveArmyCommand } from "@imperium/shared";
import { GameService } from "./game.service";

@Controller("game")
export class GameController {
  constructor(private readonly game: GameService) {}

  @Get("factions")
  getFactions() {
    return this.game.getFactions();
  }

  @Get("provinces")
  getProvinces() {
    return this.game.getProvinces();
  }

  @Get("state/:factionId")
  getState(@Param("factionId") factionId: string) {
    return this.game.getPlayerState(factionId);
  }

  @Post("commands/move-army")
  moveArmy(@Body() command: MoveArmyCommand) {
    return this.game.queueMoveArmy(command);
  }
}
