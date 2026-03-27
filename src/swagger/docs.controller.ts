import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { SwaggerService } from './swagger.service';
import { Public } from '@/auth/decorators/public.decorator';
import { ApiTags } from '@nestjs/swagger';
import { ApiGetSwaggerJson } from './docs/api-get-swagger-json.decorator';
import { ApiHideFromPortalScalar } from './docs/api-hide-from-portal-scalar.decorator';

@ApiTags('Documentation')
@Controller('api/docs')
export class DocsController {
  constructor(private readonly swaggerService: SwaggerService) {}

  @Get('verify-json')
  @Public()
  @ApiGetSwaggerJson()
  getSwaggerJson(@Res() res: Response) {
    const document = this.swaggerService.getPortalScalarDocument();
    res.setHeader('Content-Type', 'application/json');
    return res.json(document);
  }

  @Get('openapi.json')
  @Public()
  @ApiGetSwaggerJson()
  getOpenApiJson(@Res() res: Response) {
    const document = this.swaggerService.getPortalScalarDocument();
    res.setHeader('Content-Type', 'application/json');
    return res.json(document);
  }

  @Get('verify-json/swagger')
  @Public()
  @ApiGetSwaggerJson()
  @ApiHideFromPortalScalar()
  getSwaggerFullJson(@Res() res: Response) {
    const document = this.swaggerService.getSwaggerDocument();
    res.setHeader('Content-Type', 'application/json');
    return res.json(document);
  }

  @Get('openapi/swagger.json')
  @Public()
  @ApiGetSwaggerJson()
  @ApiHideFromPortalScalar()
  getOpenApiSwaggerJson(@Res() res: Response) {
    return this.getSwaggerFullJson(res);
  }
}
