import { Module } from "@nestjs/common";
import { SocketGateway } from "./socket.gateway";
import { RoomsModule } from "../rooms/rooms.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [RoomsModule, AuthModule],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}
