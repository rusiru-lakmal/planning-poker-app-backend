import { AuthService } from "./auth.service";
import { LoginDto, SignupDto } from "./dto/auth.dto";
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: any;
    }>;
    signup(signupDto: SignupDto): Promise<{
        access_token: string;
        user: any;
    }>;
    googleLogin(token: string): Promise<{
        access_token: string;
        user: any;
    }>;
    getProfile(req: any): Promise<any>;
}
