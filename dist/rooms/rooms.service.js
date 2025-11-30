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
exports.RoomsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const room_schema_1 = require("./room.schema");
let RoomsService = class RoomsService {
    constructor(roomModel) {
        this.roomModel = roomModel;
    }
    generateRoomCode() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let code = "";
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    async create(createRoomDto, userId) {
        let code = this.generateRoomCode();
        let existingRoom = await this.roomModel.findOne({ code }).exec();
        while (existingRoom) {
            code = this.generateRoomCode();
            existingRoom = await this.roomModel.findOne({ code }).exec();
        }
        const room = new this.roomModel(Object.assign(Object.assign({}, createRoomDto), { code, hostUserId: userId, deckType: createRoomDto.deckType || "fibonacci" }));
        return room.save();
    }
    async findByCode(code) {
        const room = await this.roomModel.findOne({ code }).exec();
        if (!room) {
            throw new common_1.NotFoundException("Room not found");
        }
        return room;
    }
    async findById(id) {
        const room = await this.roomModel.findById(id).exec();
        if (!room) {
            throw new common_1.NotFoundException("Room not found");
        }
        return room;
    }
    async findByHost(userId) {
        return this.roomModel
            .find({ hostUserId: userId })
            .sort({ createdAt: -1 })
            .exec();
    }
    async addParticipant(roomId, userId, name, role = "player", avatar) {
        const room = await this.findById(roomId);
        const existingParticipant = room.participants.find((p) => p.userId === userId);
        if (!existingParticipant) {
            room.participants.push({
                userId,
                name,
                role: role,
                avatar,
            });
        }
        else {
            existingParticipant.name = name;
            existingParticipant.avatar = avatar;
        }
        return room.save();
    }
    async removeParticipant(roomId, userId) {
        const room = await this.findById(roomId);
        room.participants = room.participants.filter((p) => p.userId !== userId);
        await room.save();
        return room;
    }
    async updateSettings(roomId, settings) {
        console.log(`[RoomsService] updateSettings - Room ${roomId}:`, settings);
        const update = {};
        if (settings.autoReveal !== undefined)
            update["settings.autoReveal"] = settings.autoReveal;
        if (settings.allowSpectators !== undefined)
            update["settings.allowSpectators"] = settings.allowSpectators;
        if (settings.timerDuration !== undefined) {
            const duration = Number(settings.timerDuration);
            update["settings.timerDuration"] = duration;
            if (duration === 0) {
                update["timer"] = {
                    startTime: null,
                    duration: 0,
                    status: "stopped",
                };
            }
        }
        console.log(`[RoomsService] Applying update:`, update);
        const result = await this.roomModel
            .findByIdAndUpdate(roomId, { $set: update }, { new: true, runValidators: true })
            .exec();
        console.log(`[RoomsService] updateSettings - Result:`, result === null || result === void 0 ? void 0 : result.settings);
        return result;
    }
    async updateTimer(roomId, timer) {
        return this.roomModel
            .findByIdAndUpdate(roomId, { $set: { timer } }, { new: true })
            .exec();
    }
    async startVoting(roomId) {
        var _a;
        console.log("[RoomsService] startVoting called for:", roomId);
        try {
            const room = await this.roomModel.findById(roomId);
            const update = {
                gameState: "VOTING",
                "participants.$[].vote": null,
            };
            if (room && ((_a = room.settings) === null || _a === void 0 ? void 0 : _a.timerDuration) > 0) {
                update.timer = {
                    startTime: new Date(),
                    duration: room.settings.timerDuration,
                    status: "running",
                };
                console.log(`[RoomsService] Auto-starting timer: ${room.settings.timerDuration}s`);
            }
            const updatedRoom = await this.roomModel
                .findByIdAndUpdate(roomId, { $set: update }, { new: true })
                .exec();
            console.log("[RoomsService] startVoting result:", updatedRoom === null || updatedRoom === void 0 ? void 0 : updatedRoom.gameState);
            return updatedRoom;
        }
        catch (error) {
            console.error("[RoomsService] startVoting error:", error);
            throw error;
        }
    }
    async submitVote(roomId, userId, vote) {
        var _a, _b;
        const room = await this.roomModel
            .findOneAndUpdate({ _id: roomId, "participants.userId": userId }, { $set: { "participants.$.vote": vote } }, { new: true })
            .exec();
        console.log("[RoomsService] submitVote - After update");
        console.log("[RoomsService] room.settings:", room === null || room === void 0 ? void 0 : room.settings);
        if (room && ((_a = room.settings) === null || _a === void 0 ? void 0 : _a.autoReveal) && ((_b = room.settings) === null || _b === void 0 ? void 0 : _b.timerDuration) > 0) {
            console.log("[RoomsService] Auto-reveal is ENABLED");
            const players = room.participants.filter((p) => p.role !== "spectator" && p.role !== "observer");
            const allVoted = players.every((p) => !!p.vote);
            console.log(`[RoomsService] ${players.length} players, allVoted: ${allVoted}`);
            players.forEach((p) => console.log(` - ${p.name}: ${p.vote} (hasVote=${!!p.vote})`));
            if (allVoted && players.length > 0) {
                console.log("[RoomsService] All players voted, auto-revealing...");
                return this.revealVotes(roomId);
            }
        }
        else {
            console.log("[RoomsService] Auto-reveal is DISABLED");
        }
        return room;
    }
    async revealVotes(roomId) {
        console.log("[RoomsService] revealVotes called for:", roomId);
        const result = await this.roomModel
            .findByIdAndUpdate(roomId, { gameState: "REVEALED" }, { new: true })
            .exec();
        console.log("[RoomsService] revealVotes - gameState:", result === null || result === void 0 ? void 0 : result.gameState);
        return result;
    }
    async resetGame(roomId) {
        return this.roomModel
            .findByIdAndUpdate(roomId, {
            gameState: "LOBBY",
            "participants.$[].vote": null,
        }, { new: true })
            .exec();
    }
};
exports.RoomsService = RoomsService;
exports.RoomsService = RoomsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(room_schema_1.Room.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], RoomsService);
//# sourceMappingURL=rooms.service.js.map