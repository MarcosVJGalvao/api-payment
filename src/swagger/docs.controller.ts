import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { SwaggerService } from './swagger.service';
import { Public } from '@/auth/decorators/public.decorator';
import { ApiTags } from '@nestjs/swagger';
import { ApiGetSwaggerJson } from './docs/api-get-swagger-json.decorator';

@ApiTags('Documentation')
@Controller('api/docs')
export class DocsController {
  constructor(private readonly swaggerService: SwaggerService) { }

  @Get('verify-json')
  @Public()
  @ApiGetSwaggerJson()
  getSwaggerJson(@Res() res: Response) {
    const document = this.swaggerService.getSwaggerDocument();
    res.setHeader('Content-Type', 'application/json');
    return res.json(document);
  }

  @Get('openapi.json')
  @Public()
  @ApiGetSwaggerJson()
  getOpenApiJson(@Res() res: Response) {
    return this.getSwaggerJson(res);
  }
}
