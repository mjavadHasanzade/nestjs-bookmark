import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon2 from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async login(dto: AuthDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new ForbiddenException(`incorrect user or password`);

    const passMatch = await argon2.verify(user.hash, dto.password);

    if (!passMatch) throw new ForbiddenException(`incorrect user or password`);

    delete user.hash;

    return user;
  }

  async signup(dto: AuthDto) {
    try {
      const hash = await argon2.hash(dto.password);

      const user = await this.prisma.user.create({
        data: { email: dto.email, hash },
      });

      delete user.hash;

      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new ForbiddenException('Credentials already taken');
      } else throw error;
    }
  }
}
