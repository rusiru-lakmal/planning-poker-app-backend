import { Model } from "mongoose";
import { Room, RoomDocument } from "./room.schema";
import { CreateRoomDto } from "./dto/room.dto";
export declare class RoomsService {
    private roomModel;
    constructor(roomModel: Model<RoomDocument>);
    private generateRoomCode;
    create(createRoomDto: CreateRoomDto, userId: string): Promise<Room>;
    findByCode(code: string): Promise<RoomDocument>;
    findById(id: string): Promise<RoomDocument>;
    findByHost(userId: string): Promise<RoomDocument[]>;
    addParticipant(roomId: string, userId: string, name: string, role?: "player" | "spectator" | "host", avatar?: string): Promise<RoomDocument>;
    removeParticipant(roomId: string, userId: string): Promise<RoomDocument>;
    updateSettings(roomId: string, settings: any): Promise<Room>;
    updateTimer(roomId: string, timer: any): Promise<Room>;
    startVoting(roomId: string): Promise<Room>;
    submitVote(roomId: string, userId: string, vote: string): Promise<Room>;
    revealVotes(roomId: string): Promise<Room>;
    resetGame(roomId: string): Promise<Room>;
}
