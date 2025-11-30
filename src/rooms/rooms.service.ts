import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Room, RoomDocument } from "./room.schema";
import { CreateRoomDto } from "./dto/room.dto";

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name)
    private roomModel: Model<RoomDocument>
  ) {}

  private generateRoomCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async create(createRoomDto: CreateRoomDto, userId: string): Promise<Room> {
    let code = this.generateRoomCode();

    // Ensure unique code
    let existingRoom = await this.roomModel.findOne({ code }).exec();
    while (existingRoom) {
      code = this.generateRoomCode();
      existingRoom = await this.roomModel.findOne({ code }).exec();
    }

    const room = new this.roomModel({
      ...createRoomDto,
      code,
      hostUserId: userId,
      deckType: createRoomDto.deckType || "fibonacci",
    });

    return room.save();
  }

  async findByCode(code: string): Promise<RoomDocument> {
    const room = await this.roomModel.findOne({ code }).exec();

    if (!room) {
      throw new NotFoundException("Room not found");
    }

    return room;
  }

  async findById(id: string): Promise<RoomDocument> {
    const room = await this.roomModel.findById(id).exec();

    if (!room) {
      throw new NotFoundException("Room not found");
    }

    return room;
  }

  async findByHost(userId: string): Promise<RoomDocument[]> {
    return this.roomModel
      .find({ hostUserId: userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async addParticipant(
    roomId: string,
    userId: string,
    name: string,
    role: "player" | "spectator" | "host" = "player",
    avatar?: string
  ): Promise<RoomDocument> {
    const room = await this.findById(roomId);

    // Check if participant already exists
    const existingParticipant = room.participants.find(
      (p) => p.userId === userId
    );

    if (!existingParticipant) {
      room.participants.push({
        userId,
        name,
        role: role as any,
        avatar,
      });
    } else {
      // Update existing participant info
      existingParticipant.name = name;
      existingParticipant.avatar = avatar;
    }

    return room.save();
  }

  async removeParticipant(
    roomId: string,
    userId: string
  ): Promise<RoomDocument> {
    const room = await this.findById(roomId);

    room.participants = room.participants.filter((p) => p.userId !== userId);
    await room.save();

    return room;
  }

  async updateSettings(roomId: string, settings: any): Promise<Room> {
    console.log(`[RoomsService] updateSettings - Room ${roomId}:`, settings);

    const update: any = {};
    if (settings.autoReveal !== undefined)
      update["settings.autoReveal"] = settings.autoReveal;
    if (settings.allowSpectators !== undefined)
      update["settings.allowSpectators"] = settings.allowSpectators;
    if (settings.timerDuration !== undefined) {
      const duration = Number(settings.timerDuration);
      update["settings.timerDuration"] = duration;

      // If timer is disabled (0), stop any running timer
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
      .findByIdAndUpdate(
        roomId,
        { $set: update },
        { new: true, runValidators: true }
      )
      .exec();

    console.log(`[RoomsService] updateSettings - Result:`, result?.settings);
    return result as Room;
  }

  async updateTimer(roomId: string, timer: any): Promise<Room> {
    return this.roomModel
      .findByIdAndUpdate(roomId, { $set: { timer } }, { new: true })
      .exec() as Promise<Room>;
  }

  async startVoting(roomId: string): Promise<Room> {
    console.log("[RoomsService] startVoting called for:", roomId);
    try {
      const room = await this.roomModel.findById(roomId);
      const update: any = {
        gameState: "VOTING",
        "participants.$[].vote": null,
      };

      // Auto-start timer if configured
      if (room && room.settings?.timerDuration > 0) {
        update.timer = {
          startTime: new Date(),
          duration: room.settings.timerDuration,
          status: "running",
        };
        console.log(
          `[RoomsService] Auto-starting timer: ${room.settings.timerDuration}s`
        );
      }

      const updatedRoom = await this.roomModel
        .findByIdAndUpdate(roomId, { $set: update }, { new: true })
        .exec();

      console.log("[RoomsService] startVoting result:", updatedRoom?.gameState);
      return updatedRoom as Room;
    } catch (error) {
      console.error("[RoomsService] startVoting error:", error);
      throw error;
    }
  }

  async submitVote(
    roomId: string,
    userId: string,
    vote: string
  ): Promise<Room> {
    const room = await this.roomModel
      .findOneAndUpdate(
        { _id: roomId, "participants.userId": userId },
        { $set: { "participants.$.vote": vote } },
        { new: true }
      )
      .exec();

    console.log("[RoomsService] submitVote - After update");
    console.log("[RoomsService] room.settings:", room?.settings);

    // Check for auto-reveal
    // Only auto-reveal if enabled AND timer is active (duration > 0)
    if (room && room.settings?.autoReveal && room.settings?.timerDuration > 0) {
      console.log("[RoomsService] Auto-reveal is ENABLED");
      const players = room.participants.filter(
        (p) => p.role !== "spectator" && p.role !== "observer"
      );
      const allVoted = players.every((p) => !!p.vote);

      console.log(
        `[RoomsService] ${players.length} players, allVoted: ${allVoted}`
      );
      players.forEach((p) =>
        console.log(` - ${p.name}: ${p.vote} (hasVote=${!!p.vote})`)
      );

      if (allVoted && players.length > 0) {
        console.log("[RoomsService] All players voted, auto-revealing...");
        return this.revealVotes(roomId);
      }
    } else {
      console.log("[RoomsService] Auto-reveal is DISABLED");
    }

    return room as Room;
  }

  async revealVotes(roomId: string): Promise<Room> {
    console.log("[RoomsService] revealVotes called for:", roomId);
    const result = await this.roomModel
      .findByIdAndUpdate(roomId, { gameState: "REVEALED" }, { new: true })
      .exec();
    console.log("[RoomsService] revealVotes - gameState:", result?.gameState);
    return result as Room;
  }

  async resetGame(roomId: string): Promise<Room> {
    return this.roomModel
      .findByIdAndUpdate(
        roomId,
        {
          gameState: "LOBBY",
          "participants.$[].vote": null,
        },
        { new: true }
      )
      .exec() as Promise<Room>;
  }
}
