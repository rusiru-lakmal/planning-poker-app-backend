import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  deckType?: string;

  @IsOptional()
  settings?: {
    autoReveal?: boolean;
    allowSpectators?: boolean;
    timerDuration?: number;
  };
}

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
