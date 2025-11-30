import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { LoginDto, SignupDto } from "./dto/auth.dto";
export declare class AuthService {
    private usersService;
    private jwtService;
    private googleClient;
    constructor(usersService: UsersService, jwtService: JwtService);
    validateUser(email: string, pass: string): Promise<any>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: any;
    }>;
    signup(signupDto: SignupDto): Promise<{
        access_token: string;
        user: any;
    }>;
    getProfile(userId: string): Promise<any>;
    verifyGoogleToken(token: string): Promise<{
        access_token: string;
        user: any;
    }>;
}
