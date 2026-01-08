import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { InternalUser } from './entities/internal-user.entity';
import { InternalUserController } from './internal-user.controller';
import { InternalAuthService } from './services/internal-auth.service';
import { InternalJwtService } from './services/internal-jwt.service';
import { InternalAuthGuard } from './guards/internal-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([InternalUser]),
    JwtModule.register({}),
  ],
  controllers: [InternalUserController],
  providers: [InternalAuthService, InternalJwtService, InternalAuthGuard],
  exports: [InternalAuthService, InternalJwtService, InternalAuthGuard],
})
export class InternalUserModule {}
