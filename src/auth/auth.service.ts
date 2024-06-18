import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon2 from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: AuthDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new ForbiddenException(`incorrect user or password`);

    const passMatch = await argon2.verify(user.hash, dto.password);

    if (!passMatch) throw new ForbiddenException(`incorrect user or password`);

    return this.signToken(user.id, user.email);
  }

  async signup(dto: AuthDto) {
    try {
      const hash = await argon2.hash(dto.password);

      const user = await this.prisma.user.create({
        data: { email: dto.email, hash },
      });

      return this.signToken(user.id, user.email);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new ForbiddenException('Credentials already taken');
      } else throw error;
    }
  }

  async signToken(
    id: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: id,
      email,
    };

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: this.config.get('JWT_SECRET'),
    });

    return {
      access_token: token,
    };
  }
}
