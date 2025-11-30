import { Model } from "mongoose";
import { UserDocument } from "./user.schema";
import { CreateUserDto } from "./dto/create-user.dto";
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    create(createUserDto: CreateUserDto): Promise<UserDocument>;
    createGoogleUser(email: string, name: string, avatar?: string): Promise<UserDocument>;
    findOne(email: string): Promise<UserDocument | undefined>;
    findById(id: string): Promise<UserDocument | undefined>;
}
