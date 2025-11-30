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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomSchema = exports.Room = exports.RoomSettings = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let RoomSettings = class RoomSettings {
};
exports.RoomSettings = RoomSettings;
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], RoomSettings.prototype, "autoReveal", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], RoomSettings.prototype, "allowSpectators", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], RoomSettings.prototype, "timerDuration", void 0);
exports.RoomSettings = RoomSettings = __decorate([
    (0, mongoose_1.Schema)()
], RoomSettings);
let Room = class Room {
};
exports.Room = Room;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Room.prototype, "code", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Room.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Room.prototype, "hostUserId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: "fibonacci" }),
    __metadata("design:type", String)
], Room.prototype, "deckType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: [] }),
    __metadata("design:type", Array)
], Room.prototype, "participants", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ["LOBBY", "VOTING", "REVEALED"],
        default: "LOBBY",
    }),
    __metadata("design:type", String)
], Room.prototype, "gameState", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: [] }),
    __metadata("design:type", Array)
], Room.prototype, "stories", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Room.prototype, "currentStoryId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: RoomSettings,
        default: () => ({
            autoReveal: false,
            allowSpectators: true,
            timerDuration: 0,
        }),
    }),
    __metadata("design:type", RoomSettings)
], Room.prototype, "settings", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Object,
        default: {
            status: "stopped",
            duration: 0,
            startTime: null,
        },
    }),
    __metadata("design:type", Object)
], Room.prototype, "timer", void 0);
exports.Room = Room = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Room);
exports.RoomSchema = mongoose_1.SchemaFactory.createForClass(Room);
//# sourceMappingURL=room.schema.js.map