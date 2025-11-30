import { Document } from "mongoose";
export type RoomDocument = Room & Document;
export declare class RoomSettings {
    autoReveal: boolean;
    allowSpectators: boolean;
    timerDuration: number;
}
export declare class Room {
    _id: string;
    code: string;
    name: string;
    hostUserId: string;
    deckType: string;
    participants: {
        userId: string;
        name: string;
        avatar?: string;
        role: "host" | "player" | "observer" | "spectator";
        vote?: string | null;
    }[];
    gameState: "LOBBY" | "VOTING" | "REVEALED";
    stories: {
        id: string;
        title: string;
        description?: string;
        estimate?: string;
        status: "pending" | "active" | "completed";
        votes?: {
            userId: string;
            vote: string;
        }[];
    }[];
    currentStoryId?: string;
    settings: RoomSettings;
    timer: {
        startTime?: Date;
        duration: number;
        status: "running" | "paused" | "stopped";
    };
}
export declare const RoomSchema: import("mongoose").Schema<Room, import("mongoose").Model<Room, any, any, any, Document<unknown, any, Room, any, {}> & Room & Required<{
    _id: string;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Room, Document<unknown, {}, import("mongoose").FlatRecord<Room>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Room> & Required<{
    _id: string;
}> & {
    __v: number;
}>;
