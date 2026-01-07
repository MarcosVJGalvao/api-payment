import { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getHiperbancoConfig } from '../hiperbanco/helpers/hiperbanco-config.helper';

export const HiperbancoConfigProvider: FactoryProvider = {
    provide: 'HIPERBANCO_CONFIG',
    useFactory: (configService: ConfigService) => getHiperbancoConfig(configService),
    inject: [ConfigService],
};
