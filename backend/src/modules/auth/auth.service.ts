import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.usersService.findByPhone(dto.phone);
    if (exists) throw new ConflictException('User already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const isApproved = dto.role === 'CLIENT';
    const user = await this.usersService.create({
      phone: dto.phone,
      passwordHash,
      fullName: dto.fullName,
      role: dto.role,
      isApproved: isApproved,
    } as any);

    if(!isApproved) {
      return { message: 'Заявка отправлена. Ожидайте подтверждения администратором.'};
    }

    const tokens = await this.getTokens(user.id, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByPhone(dto.phone);
    if (!user) throw new UnauthorizedException('Access Denied');

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) throw new UnauthorizedException('Access Denied');

    if (!user.isApproved) {
      throw new ForbiddenException('Ваш аккаунт еще не подтвержден администратором.')
    }

    const tokens = await this.getTokens(user.id, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  async updateRefreshToken(userId: string, rt: string) {
    const hash = await bcrypt.hash(rt, 10);
    await this.usersService.updateRt(userId, hash);
  }

  async getTokens(userId: string, role: string) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, role },
        { secret: process.env.JWT_SECRET, expiresIn: '1h' },
      ),
      this.jwtService.signAsync(
        { sub: userId, role },
        { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' },
      ),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }
}
