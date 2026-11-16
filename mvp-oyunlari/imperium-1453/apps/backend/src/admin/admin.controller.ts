import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { GameService } from "../game/game.service";

@Controller("admin")
export class AdminController {
  constructor(private readonly game: GameService) {}

  @Get("provinces")
  getProvinces() {
    return this.game.getProvinces();
  }

  @Post("provinces")
  createProvince(@Body() body: unknown) {
    return { status: "planned", body };
  }

  @Patch("provinces/:id")
  updateProvince(@Param("id") id: string, @Body() body: unknown) {
    return { status: "planned", id, body };
  }

  @Get("factions")
  getFactions() {
    return this.game.getFactions();
  }

  @Patch("factions/:id")
  updateFaction(@Param("id") id: string, @Body() body: unknown) {
    return { status: "planned", id, body };
  }
}
