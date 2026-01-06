import { Module } from '@nestjs/common';
import { SwaggerService } from './swagger.service';
import { DocsController } from './docs.controller';
import { LoggerModule } from '@/common/logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [DocsController],
  providers: [SwaggerService],
  exports: [SwaggerService],
})
export class DocsModule {}
