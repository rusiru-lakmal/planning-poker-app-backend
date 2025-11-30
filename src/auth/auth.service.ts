import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { LoginDto, SignupDto } from "./dto/auth.dto";
import { OAuth2Client } from "google-auth-library";

@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const payload = { email: user.email, sub: (user as any)._id.toString() };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async signup(signupDto: SignupDto) {
    const existingUser = await this.usersService.findOne(signupDto.email);
    if (existingUser) {
      throw new ConflictException("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(signupDto.password, 10);
    const user = await this.usersService.create({
      ...signupDto,
      password: hashedPassword,
    });

    const payload = { email: user.email, sub: (user as any)._id.toString() };
    const { password, ...result } = user.toObject();

    return {
      access_token: this.jwtService.sign(payload),
      user: result,
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    const { password, ...result } = user.toObject();
    return result;
  }

  async verifyGoogleToken(token: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: [
          process.env.GOOGLE_CLIENT_ID_WEB,
          process.env.GOOGLE_CLIENT_ID_ANDROID,
          process.env.GOOGLE_CLIENT_ID_IOS,
        ],
      });
      const payload = ticket.getPayload();
      if (!payload) throw new UnauthorizedException("Invalid Google Token");

      const { email, name, picture } = payload;

      let user = await this.usersService.findOne(email);
      if (!user) {
        user = await this.usersService.createGoogleUser(email, name, picture);
      }

      const jwtPayload = {
        email: user.email,
        sub: (user as any)._id.toString(),
      };
      const { password, ...result } = user.toObject();

      return {
        access_token: this.jwtService.sign(jwtPayload),
        user: result,
      };
    } catch (error) {
      console.error("Google Auth Error:", error);
      throw new UnauthorizedException("Invalid Google Token");
    }
  }
}
