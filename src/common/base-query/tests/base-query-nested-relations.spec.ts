import { BaseQueryService } from '../service/base-query.service';
import { Repository } from 'typeorm';
import { FilterOperator } from '../enums/filter-operator.enum';
import { createBaseQueryServiceTestFactory } from './factory/base-query.service.factory';
import { createMockRepository } from './mocks/base-query.mock';

/**
 * Testes para validar relações aninhadas e select com campos de relações
 * Casos críticos que NÃO podem quebrar:
 * - employee.person (User)
 * - person.addresses, person.contactInfos (Guardian)
 * - student.person (Enrollment)
 * - enrollment.student (Grade, Attendance)
 * - rolePermissions.permission (Role)
 * - rolePermissions.role (Permission)
 */
describe('BaseQueryService - Nested Relations Critical Tests', () => {
  let service: BaseQueryService;
  let mockRepository: jest.Mocked<Repository<any>>;

  beforeEach(async () => {
    const factory = await createBaseQueryServiceTestFactory();
    service = factory.service;
    mockRepository = createMockRepository();
  });

  describe('Caso 1: Relações aninhadas simples (employee.person)', () => {
    it('deve construir queryOptions corretamente para employee.person', () => {
      const dto = {
        page: 1,
        limit: 10,
        search: 'test', // search é necessário para searchFields serem processados
      };

      const options = service.buildQueryOptions(mockRepository, dto, {
        relations: ['employee', 'employee.person'],
        defaultSortBy: 'createdAt',
        searchFields: ['name', 'employee.person.name'],
      });

      expect(options.relations).toEqual(['employee', 'employee.person']);
      expect(options.searchFields).toEqual(['name', 'employee.person.name']);
    });

    it('deve executar findAll sem erros com employee.person', async () => {
      const options = {
        page: 1,
        limit: 10,
        relations: ['employee', 'employee.person'],
        sortBy: 'createdAt',
        sortOrder: 'ASC' as const,
      };

      await expect(
        service.findAll(mockRepository, options),
      ).resolves.not.toThrow();

      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('Caso 2: Múltiplas relações aninhadas (person.addresses, person.contactInfos)', () => {
    it('deve construir queryOptions corretamente para múltiplas relações aninhadas', () => {
      const dto = {
        page: 1,
        limit: 10,
        search: 'test', // search é necessário para searchFields serem processados
      };

      const options = service.buildQueryOptions(mockRepository, dto, {
        relations: ['person', 'person.addresses', 'person.contactInfos'],
        defaultSortBy: 'createdAt',
        searchFields: ['person.name', 'person.addresses.city'],
      });

      expect(options.relations).toEqual([
        'person',
        'person.addresses',
        'person.contactInfos',
      ]);
      expect(options.searchFields).toEqual([
        'person.name',
        'person.addresses.city',
      ]);
    });

    it('deve executar findAll sem erros com múltiplas relações aninhadas', async () => {
      const options = {
        page: 1,
        limit: 10,
        relations: ['person', 'person.addresses', 'person.contactInfos'],
        sortBy: 'createdAt',
        sortOrder: 'ASC' as const,
      };

      await expect(
        service.findAll(mockRepository, options),
      ).resolves.not.toThrow();
    });
  });

  describe('Caso 3: Select com campos de relações aninhadas', () => {
    it('deve construir queryOptions com select de campos aninhados', () => {
      const dto = {
        page: 1,
        limit: 10,
      };

      const options = service.buildQueryOptions(mockRepository, dto, {
        relations: ['employee', 'employee.person'],
        select: [
          'id',
          'name',
          'employee.id',
          'employee.position',
          'employee.person.name',
        ],
        defaultSortBy: 'createdAt',
      });

      expect(options.select).toEqual([
        'id',
        'name',
        'employee.id',
        'employee.position',
        'employee.person.name',
      ]);
    });

    it('deve executar findAll com select de campos aninhados sem erros', async () => {
      const options = {
        page: 1,
        limit: 10,
        relations: ['employee', 'employee.person'],
        select: [
          'id',
          'name',
          'employee.id',
          'employee.position',
          'employee.person.name',
        ],
        sortBy: 'createdAt',
        sortOrder: 'ASC' as const,
      };

      await expect(
        service.findAll(mockRepository, options),
      ).resolves.not.toThrow();
    });
  });

  describe('Caso 4: Filtros com relation e mapField', () => {
    it('deve construir filtros com relation e mapField corretamente', () => {
      const dto = {
        page: 1,
        limit: 10,
        employeePositions: 'Manager',
      };

      const options = service.buildQueryOptions(mockRepository, dto, {
        relations: ['employee'],
        filters: [
          {
            field: 'employeePositions',
            operator: FilterOperator.IN,
            relation: 'employee',
            mapField: 'position',
          },
        ],
        defaultSortBy: 'createdAt',
      });

      // Verifica se o filtro foi construído corretamente
      expect(options.filters).toBeDefined();
      expect(options.filters?.length).toBeGreaterThan(0);
    });
  });

  describe('Caso 5: SearchFields em relações', () => {
    it('deve aplicar search em campos de relações', () => {
      const dto = {
        page: 1,
        limit: 10,
        search: 'João',
      };

      const options = service.buildQueryOptions(mockRepository, dto, {
        relations: ['person'],
        searchFields: ['person.name', 'person.documentNumber'],
        defaultSortBy: 'createdAt',
      });

      expect(options.search).toBe('João');
      expect(options.searchFields).toEqual([
        'person.name',
        'person.documentNumber',
      ]);
    });

    it('deve executar findAll com search em relações sem erros', async () => {
      const options = {
        page: 1,
        limit: 10,
        search: 'João',
        searchFields: ['person.name', 'person.documentNumber'],
        relations: ['person'],
        sortBy: 'createdAt',
        sortOrder: 'ASC' as const,
      };

      await expect(
        service.findAll(mockRepository, options),
      ).resolves.not.toThrow();
    });
  });

  describe('Caso 6: Validação de relações obrigatórias para select', () => {
    it('deve lançar erro se select referenciar relação não carregada', () => {
      const dto = {
        page: 1,
        limit: 10,
      };

      expect(() =>
        service.buildQueryOptions(mockRepository, dto, {
          relations: ['employee'], // Falta employee.person
          select: ['id', 'employee.person.name'], // Tenta usar employee.person
        }),
      ).toThrow();
    });

    it('deve aceitar select com relação carregada', () => {
      const dto = {
        page: 1,
        limit: 10,
      };

      expect(() =>
        service.buildQueryOptions(mockRepository, dto, {
          relations: ['employee', 'employee.person'],
          select: ['id', 'employee.person.name'],
        }),
      ).not.toThrow();
    });
  });

  describe('Caso 7: Ordenação por campos de relações aninhadas', () => {
    it('deve permitir ordenação por campo de relação aninhada', async () => {
      const options = {
        page: 1,
        limit: 10,
        relations: ['employee', 'employee.person'],
        sortBy: 'employee.person.name',
        sortOrder: 'ASC' as const,
      };

      await expect(
        service.findAll(mockRepository, options),
      ).resolves.not.toThrow();
    });
  });

  describe('Caso 8: Filtros de data com relações', () => {
    it('deve aplicar filtros de data mesmo com relações aninhadas', () => {
      const dto = {
        page: 1,
        limit: 10,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const options = service.buildQueryOptions(mockRepository, dto, {
        relations: ['employee', 'employee.person'],
        dateField: 'createdAt',
        defaultSortBy: 'createdAt',
      });

      expect(options.filters).toBeDefined();
      const dateFilter = options.filters?.find(
        (f) => f.operator === FilterOperator.BETWEEN,
      );
      expect(dateFilter).toBeDefined();
      expect(dateFilter?.field).toBe('createdAt');
    });
  });
});
