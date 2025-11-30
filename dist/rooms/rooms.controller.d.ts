import { RoomsService } from "./rooms.service";
import { CreateRoomDto, JoinRoomDto } from "./dto/room.dto";
interface UserRequest extends Request {
    user: {
        userId: string;
        email: string;
    };
}
export declare class RoomsController {
    private roomsService;
    constructor(roomsService: RoomsService);
    create(createRoomDto: CreateRoomDto, req: UserRequest): Promise<import("./room.schema").Room>;
    join(joinRoomDto: JoinRoomDto): Promise<import("./room.schema").RoomDocument>;
    findOne(id: string): Promise<import("./room.schema").RoomDocument>;
    findMyRooms(req: UserRequest): Promise<import("./room.schema").RoomDocument[]>;
}
export {};
