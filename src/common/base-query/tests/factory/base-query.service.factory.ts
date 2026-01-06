import { Test, TestingModule } from '@nestjs/testing';
import { BaseQueryService } from '../../service/base-query.service';

/**
 * Factory para criar instância do BaseQueryService para testes
 */
export const createBaseQueryServiceTestFactory = async (): Promise<{
  service: BaseQueryService;
  module: TestingModule;
}> => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [BaseQueryService],
  }).compile();

  const service = module.get<BaseQueryService>(BaseQueryService);

  return {
    service,
    module,
  };
};
