import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { RoomsService } from "./rooms.service";
import { CreateRoomDto, JoinRoomDto } from "./dto/room.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

interface UserRequest extends Request {
  user: { userId: string; email: string };
}

@Controller("rooms")
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Post()
  async create(
    @Body() createRoomDto: CreateRoomDto,
    @Request() req: UserRequest
  ) {
    return this.roomsService.create(createRoomDto, req.user.userId);
  }

  @Post("join")
  async join(@Body() joinRoomDto: JoinRoomDto) {
    return this.roomsService.findByCode(joinRoomDto.code);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.roomsService.findById(id);
  }

  @Get("my/rooms")
  async findMyRooms(@Request() req: UserRequest) {
    console.log("findMyRooms called for user:", req.user.userId);
    return this.roomsService.findByHost(req.user.userId);
  }
}
