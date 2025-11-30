import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { RoomsService } from "../rooms/rooms.service";
import { AuthService } from "../auth/auth.service";
import { JwtService } from "@nestjs/jwt";
export declare class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private roomsService;
    private authService;
    private jwtService;
    server: Server;
    constructor(roomsService: RoomsService, authService: AuthService, jwtService: JwtService);
    afterInit(server: Server): void;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinRoom(data: {
        roomId: string;
        userId: string;
        name: string;
        role?: "player" | "spectator" | "host";
        avatar?: string;
    }, client: Socket): Promise<{
        status: string;
        room: import("../rooms/room.schema").RoomDocument;
        error?: undefined;
    } | {
        status: string;
        error: any;
        room?: undefined;
    }>;
    handleLeaveRoom(data: {
        roomId: string;
        userId: string;
    }, client: Socket): Promise<void>;
    handleUpdateSettings(data: {
        roomId: string;
        settings: any;
    }): Promise<void>;
    handleStartTimer(data: {
        roomId: string;
        duration: number;
    }): Promise<void>;
    handlePauseTimer(data: {
        roomId: string;
    }): Promise<void>;
    handleStopTimer(data: {
        roomId: string;
    }): Promise<void>;
    handleStartVoting(data: {
        roomId: string;
    }): Promise<void>;
    handleSubmitVote(data: {
        roomId: string;
        userId: string;
        vote: string;
    }): Promise<void>;
    handleRevealVotes(data: {
        roomId: string;
    }): Promise<void>;
    handleResetGame(data: {
        roomId: string;
    }): Promise<void>;
}
