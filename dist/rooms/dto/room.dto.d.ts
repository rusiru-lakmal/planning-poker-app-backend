export declare class CreateRoomDto {
    name: string;
    deckType?: string;
    settings?: {
        autoReveal?: boolean;
        allowSpectators?: boolean;
        timerDuration?: number;
    };
}
export declare class JoinRoomDto {
    code: string;
    name: string;
}
