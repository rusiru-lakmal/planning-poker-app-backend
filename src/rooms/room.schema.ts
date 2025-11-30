import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type RoomDocument = Room & Document;

@Schema()
export class RoomSettings {
  @Prop({ default: false })
  autoReveal: boolean;

  @Prop({ default: true })
  allowSpectators: boolean;

  @Prop({ default: 0 })
  timerDuration: number;
}

@Schema({ timestamps: true })
export class Room {
  _id: string;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  hostUserId: string;

  @Prop({ default: "fibonacci" })
  deckType: string;

  @Prop({ default: [] })
  participants: {
    userId: string;
    name: string;
    avatar?: string;
    role: "host" | "player" | "observer" | "spectator";
    vote?: string | null;
  }[];

  @Prop({
    type: String,
    enum: ["LOBBY", "VOTING", "REVEALED"],
    default: "LOBBY",
  })
  gameState: "LOBBY" | "VOTING" | "REVEALED";

  @Prop({ default: [] })
  stories: {
    id: string;
    title: string;
    description?: string;
    estimate?: string;
    status: "pending" | "active" | "completed";
    votes?: { userId: string; vote: string }[];
  }[];

  @Prop()
  currentStoryId?: string;

  @Prop({
    type: RoomSettings,
    default: () => ({
      autoReveal: false,
      allowSpectators: true,
      timerDuration: 0,
    }),
  })
  settings: RoomSettings;

  @Prop({
    type: Object,
    default: {
      status: "stopped",
      duration: 0,
      startTime: null,
    },
  })
  timer: {
    startTime?: Date;
    duration: number;
    status: "running" | "paused" | "stopped";
  };
}

export const RoomSchema = SchemaFactory.createForClass(Room);
