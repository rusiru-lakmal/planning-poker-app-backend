"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const rooms_service_1 = require("../rooms/rooms.service");
const auth_service_1 = require("../auth/auth.service");
const jwt_1 = require("@nestjs/jwt");
let SocketGateway = class SocketGateway {
    constructor(roomsService, authService, jwtService) {
        this.roomsService = roomsService;
        this.authService = authService;
        this.jwtService = jwtService;
    }
    afterInit(server) {
        console.log("WebSocket Gateway initialized");
    }
    async handleConnection(client) {
        var _a;
        try {
            const token = (_a = client.handshake.auth.token) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
            if (!token) {
                return;
            }
            const payload = this.jwtService.verify(token);
            client.user = payload;
            console.log(`Client connected: ${client.id}, User: ${payload.email}`);
        }
        catch (e) {
            console.log(`Client connected without valid auth: ${client.id}`);
        }
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
    }
    async handleJoinRoom(data, client) {
        console.log(`[SocketGateway] Received joinRoom event:`, data);
        client.join(data.roomId);
        console.log(`User ${data.userId} joined room ${data.roomId}`);
        try {
            console.log("[SocketGateway] Calling addParticipant...");
            const room = await this.roomsService.addParticipant(data.roomId, data.userId, data.name, data.role || "player", data.avatar);
            console.log("[SocketGateway] Participant added, room:", room);
            console.log(`[SocketGateway] Emitting roomUpdated to room ${data.roomId}`);
            this.server.to(data.roomId).emit("roomUpdated", room);
            this.server.to(data.roomId).emit("userJoined", {
                userId: data.userId,
                name: data.name,
                avatar: data.avatar,
                role: data.role,
            });
            console.log(`[SocketGateway] Events emitted successfully`);
            return { status: "ok", room };
        }
        catch (error) {
            console.error("[SocketGateway] Error in handleJoinRoom:", error);
            return { status: "error", error: error.message };
        }
    }
    async handleLeaveRoom(data, client) {
        client.leave(data.roomId);
        console.log(`User ${data.userId} left room ${data.roomId}`);
        const room = await this.roomsService.removeParticipant(data.roomId, data.userId);
        this.server.to(data.roomId).emit("roomUpdated", room);
        this.server.to(data.roomId).emit("userLeft", {
            userId: data.userId,
        });
    }
    async handleUpdateSettings(data) {
        console.log("[SocketGateway] Received updateSettings event:", data);
        const room = await this.roomsService.updateSettings(data.roomId, data.settings);
        console.log("[SocketGateway] Broadcasting roomUpdated after settings update");
        this.server.to(data.roomId).emit("roomUpdated", room);
    }
    async handleStartTimer(data) {
        const timer = {
            startTime: new Date(),
            duration: data.duration,
            status: "running",
        };
        const room = await this.roomsService.updateTimer(data.roomId, timer);
        this.server.to(data.roomId).emit("roomUpdated", room);
    }
    async handlePauseTimer(data) {
        const room = await this.roomsService.findById(data.roomId);
        if (room && room.timer) {
            const timer = Object.assign(Object.assign({}, room.timer), { status: "paused" });
            const updatedRoom = await this.roomsService.updateTimer(data.roomId, timer);
            this.server.to(data.roomId).emit("roomUpdated", updatedRoom);
        }
    }
    async handleStopTimer(data) {
        const timer = { duration: 0, status: "stopped" };
        const room = await this.roomsService.updateTimer(data.roomId, timer);
        this.server.to(data.roomId).emit("roomUpdated", room);
    }
    async handleStartVoting(data) {
        console.log("[SocketGateway] Received startVoting event for room:", data.roomId);
        const room = await this.roomsService.startVoting(data.roomId);
        this.server.to(data.roomId).emit("roomUpdated", room);
    }
    async handleSubmitVote(data) {
        const room = await this.roomsService.submitVote(data.roomId, data.userId, data.vote);
        this.server.to(data.roomId).emit("roomUpdated", room);
    }
    async handleRevealVotes(data) {
        const room = await this.roomsService.revealVotes(data.roomId);
        this.server.to(data.roomId).emit("roomUpdated", room);
    }
    async handleResetGame(data) {
        const room = await this.roomsService.resetGame(data.roomId);
        this.server.to(data.roomId).emit("roomUpdated", room);
    }
};
exports.SocketGateway = SocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], SocketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)("joinRoom"),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("leaveRoom"),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("updateSettings"),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleUpdateSettings", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("startTimer"),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleStartTimer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("pauseTimer"),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handlePauseTimer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("stopTimer"),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleStopTimer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("startVoting"),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleStartVoting", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("submitVote"),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleSubmitVote", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("revealVotes"),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleRevealVotes", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("resetGame"),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleResetGame", null);
exports.SocketGateway = SocketGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: "*",
        },
    }),
    __metadata("design:paramtypes", [rooms_service_1.RoomsService,
        auth_service_1.AuthService,
        jwt_1.JwtService])
], SocketGateway);
//# sourceMappingURL=socket.gateway.js.map