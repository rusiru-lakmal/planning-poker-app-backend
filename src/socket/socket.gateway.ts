import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { RoomsService } from "../rooms/rooms.service";
import { AuthService } from "../auth/auth.service";
import { JwtService } from "@nestjs/jwt";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;

  constructor(
    private roomsService: RoomsService,
    private authService: AuthService,
    private jwtService: JwtService
  ) {}

  afterInit(server: Server) {
    console.log("WebSocket Gateway initialized");
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token?.split(" ")[1];
      if (!token) {
        // Allow connection without token for now, but might restrict later
        // client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token);
      // Attach user to socket
      (client as any).user = payload;
      console.log(`Client connected: ${client.id}, User: ${payload.email}`);
    } catch (e) {
      console.log(`Client connected without valid auth: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("joinRoom")
  async handleJoinRoom(
    @MessageBody()
    data: {
      roomId: string;
      userId: string;
      name: string;
      role?: "player" | "spectator" | "host";
      avatar?: string;
    },
    @ConnectedSocket() client: Socket
  ) {
    console.log(`[SocketGateway] Received joinRoom event:`, data);
    client.join(data.roomId);
    console.log(`User ${data.userId} joined room ${data.roomId}`);

    try {
      // Add participant to room
      console.log("[SocketGateway] Calling addParticipant...");
      const room = await this.roomsService.addParticipant(
        data.roomId,
        data.userId,
        data.name,
        data.role || "player",
        data.avatar
      );
      console.log("[SocketGateway] Participant added, room:", room);

      // Notify all clients in the room
      console.log(
        `[SocketGateway] Emitting roomUpdated to room ${data.roomId}`
      );
      this.server.to(data.roomId).emit("roomUpdated", room);
      this.server.to(data.roomId).emit("userJoined", {
        userId: data.userId,
        name: data.name,
        avatar: data.avatar,
        role: data.role,
      });
      console.log(`[SocketGateway] Events emitted successfully`);
      return { status: "ok", room };
    } catch (error: any) {
      console.error("[SocketGateway] Error in handleJoinRoom:", error);
      return { status: "error", error: error.message };
    }
  }

  @SubscribeMessage("leaveRoom")
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket
  ) {
    client.leave(data.roomId);
    console.log(`User ${data.userId} left room ${data.roomId}`);

    // Remove participant from room
    const room = await this.roomsService.removeParticipant(
      data.roomId,
      data.userId
    );

    // Notify all clients in the room
    this.server.to(data.roomId).emit("roomUpdated", room);
    this.server.to(data.roomId).emit("userLeft", {
      userId: data.userId,
    });
  }

  @SubscribeMessage("updateSettings")
  async handleUpdateSettings(
    @MessageBody() data: { roomId: string; settings: any }
  ) {
    console.log("[SocketGateway] Received updateSettings event:", data);
    const room = await this.roomsService.updateSettings(
      data.roomId,
      data.settings
    );
    console.log(
      "[SocketGateway] Broadcasting roomUpdated after settings update"
    );
    this.server.to(data.roomId).emit("roomUpdated", room);
  }

  @SubscribeMessage("startTimer")
  async handleStartTimer(
    @MessageBody() data: { roomId: string; duration: number }
  ) {
    const timer = {
      startTime: new Date(),
      duration: data.duration,
      status: "running",
    };
    const room = await this.roomsService.updateTimer(data.roomId, timer);
    this.server.to(data.roomId).emit("roomUpdated", room);
  }

  @SubscribeMessage("pauseTimer")
  async handlePauseTimer(@MessageBody() data: { roomId: string }) {
    // Ideally we calculate remaining time here, but for simplicity just status update
    const room = await this.roomsService.findById(data.roomId);
    if (room && room.timer) {
      const timer = { ...room.timer, status: "paused" };
      const updatedRoom = await this.roomsService.updateTimer(
        data.roomId,
        timer
      );
      this.server.to(data.roomId).emit("roomUpdated", updatedRoom);
    }
  }

  @SubscribeMessage("stopTimer")
  async handleStopTimer(@MessageBody() data: { roomId: string }) {
    const timer = { duration: 0, status: "stopped" };
    const room = await this.roomsService.updateTimer(data.roomId, timer);
    this.server.to(data.roomId).emit("roomUpdated", room);
  }

  @SubscribeMessage("startVoting")
  async handleStartVoting(@MessageBody() data: { roomId: string }) {
    console.log(
      "[SocketGateway] Received startVoting event for room:",
      data.roomId
    );
    const room = await this.roomsService.startVoting(data.roomId);
    this.server.to(data.roomId).emit("roomUpdated", room);
  }

  @SubscribeMessage("submitVote")
  async handleSubmitVote(
    @MessageBody() data: { roomId: string; userId: string; vote: string }
  ) {
    const room = await this.roomsService.submitVote(
      data.roomId,
      data.userId,
      data.vote
    );
    this.server.to(data.roomId).emit("roomUpdated", room);
  }

  @SubscribeMessage("revealVotes")
  async handleRevealVotes(@MessageBody() data: { roomId: string }) {
    const room = await this.roomsService.revealVotes(data.roomId);
    this.server.to(data.roomId).emit("roomUpdated", room);
  }

  @SubscribeMessage("resetGame")
  async handleResetGame(@MessageBody() data: { roomId: string }) {
    const room = await this.roomsService.resetGame(data.roomId);
    this.server.to(data.roomId).emit("roomUpdated", room);
  }
}
