import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { InternalUser } from '../entities/internal-user.entity';
import { LoginInternalUserDto } from '../dto/login-internal-user.dto';
import { InternalJwtService } from './internal-jwt.service';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { InternalUserJwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class InternalAuthService {
  constructor(
    @InjectRepository(InternalUser)
    private readonly repository: Repository<InternalUser>,
    private readonly jwtService: InternalJwtService,
  ) {}

  async login(loginDto: LoginInternalUserDto): Promise<{ access_token: string }> {
    const user = await this.repository.findOne({
      where: { username: loginDto.username },
    });

    if (!user) {
      throw new CustomHttpException(
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_CREDENTIALS,
      );
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new CustomHttpException(
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_CREDENTIALS,
      );
    }

    const payload: InternalUserJwtPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      type: 'internal',
    };

    const access_token = this.jwtService.generateToken(payload);

    return { access_token };
  }

  async validateUser(userId: string): Promise<InternalUser | null> {
    return this.repository.findOne({ where: { id: userId } });
  }
}
