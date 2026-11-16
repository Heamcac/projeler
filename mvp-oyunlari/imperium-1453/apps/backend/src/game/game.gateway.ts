import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import type { Server } from "socket.io";

@WebSocketGateway({ cors: { origin: true } })
export class GameGateway {
  @WebSocketServer()
  server!: Server;

  publishProvinceUpdate(payload: unknown) {
    this.server.emit("province:updated", payload);
  }

  publishCommandAccepted(payload: unknown) {
    this.server.emit("command:accepted", payload);
  }
}
