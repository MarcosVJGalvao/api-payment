import { Repository, DataSource } from 'typeorm';

/**
 * Mock completo do Repository para testes do BaseQuery
 * Inclui metadados complexos com relações aninhadas
 */
export const createMockRepository = (): jest.Mocked<Repository<any>> => {
  const mockQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };

  return {
    metadata: {
      name: 'TestEntity',
      columns: [
        { propertyName: 'id', isVirtual: false },
        { propertyName: 'name', isVirtual: false },
        { propertyName: 'createdAt', isVirtual: false },
      ],
      relations: [
        {
          propertyName: 'employee',
          inverseEntityMetadata: {
            name: 'Employee',
            columns: [
              { propertyName: 'id', isVirtual: false },
              { propertyName: 'position', isVirtual: false },
            ],
            relations: [
              {
                propertyName: 'person',
                inverseEntityMetadata: {
                  name: 'Person',
                  columns: [
                    { propertyName: 'id', isVirtual: false },
                    { propertyName: 'name', isVirtual: false },
                    { propertyName: 'documentNumber', isVirtual: false },
                  ],
                  relations: [],
                },
                joinColumns: [],
              },
            ],
          },
          joinColumns: [],
        },
        {
          propertyName: 'person',
          inverseEntityMetadata: {
            name: 'Person',
            columns: [
              { propertyName: 'id', isVirtual: false },
              { propertyName: 'name', isVirtual: false },
            ],
            relations: [
              {
                propertyName: 'addresses',
                inverseEntityMetadata: {
                  name: 'Address',
                  columns: [
                    { propertyName: 'id', isVirtual: false },
                    { propertyName: 'city', isVirtual: false },
                    { propertyName: 'street', isVirtual: false },
                  ],
                  relations: [],
                },
                joinColumns: [],
              },
              {
                propertyName: 'contactInfos',
                inverseEntityMetadata: {
                  name: 'ContactInfo',
                  columns: [
                    { propertyName: 'id', isVirtual: false },
                    { propertyName: 'phone', isVirtual: false },
                    { propertyName: 'email', isVirtual: false },
                  ],
                  relations: [],
                },
                joinColumns: [],
              },
            ],
          },
          joinColumns: [],
        },
      ],
    },
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    manager: {
      connection: {} as DataSource,
    },
  } as any;
};

/**
 * Mock do QueryBuilder isolado para testes específicos
 */
export const createMockQueryBuilder = () => ({
  leftJoin: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
});
