import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateOAuthLogin(profile: any): Promise<string> {
    try {
      let user = await this.usersService.user({ email: profile.email });
      
      if (!user) {
        user = await this.usersService.createUser({
          email: profile.email,
          name: `${profile.firstName} ${profile.lastName}`.trim(),
        });
      }

      const payload = { sub: user.id, email: user.email, role: user.role };
      return this.jwtService.sign(payload);
    } catch (err) {
      throw err;
    }
  }
}
