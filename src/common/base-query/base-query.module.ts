import { Module, Global } from '@nestjs/common';
import { BaseQueryService } from './service/base-query.service';

@Global()
@Module({
    providers: [BaseQueryService],
    exports: [BaseQueryService],
})
export class BaseQueryModule { }
