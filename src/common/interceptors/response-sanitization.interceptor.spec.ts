import { ExecutionContext, StreamableFile } from '@nestjs/common';
import { of, firstValueFrom } from 'rxjs';
import { ResponseSanitizationInterceptor } from './response-sanitization.interceptor';

describe('ResponseSanitizationInterceptor', () => {
  const interceptor = new ResponseSanitizationInterceptor(['password']);

  function createContext(
    path: string,
    method: string = 'GET',
  ): ExecutionContext {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ path, method }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should sanitize sensitive fields and nested timestamps in a single pass', async () => {
    const payload = {
      id: '1',
      createdAt: 'root-created',
      user: {
        password: 'secret',
        createdAt: 'nested-created',
        profile: {
          updatedAt: 'nested-updated',
          name: 'john',
        },
      },
      data: [
        {
          id: '2',
          updatedAt: 'item-root-updated',
          nested: { deletedAt: 'nested-deleted', foo: 'bar' },
        },
      ],
      meta: { total: 1 },
    };

    const next = { handle: () => of(payload) };
    const result = await firstValueFrom(
      interceptor.intercept(createContext('/v1/users'), next as any),
    );

    expect(result).toEqual({
      id: '1',
      createdAt: 'root-created',
      user: {
        password: 'secret',
        createdAt: 'nested-created',
        profile: {
          updatedAt: 'nested-updated',
          name: 'john',
        },
      },
      data: [
        {
          id: '2',
          updatedAt: 'item-root-updated',
          nested: { foo: 'bar' },
        },
      ],
      meta: { total: 1 },
    });
  });

  it('should bypass transformation for export routes', async () => {
    const payload = { password: 'secret' };
    const next = { handle: () => of(payload) };
    const result = await firstValueFrom(
      interceptor.intercept(createContext('/v1/reports/export'), next as any),
    );

    expect(result).toBe(payload);
  });

  it('should keep streamable files untouched', async () => {
    const file = new StreamableFile(Buffer.from('test'));
    const next = { handle: () => of(file) };
    const result = await firstValueFrom(
      interceptor.intercept(createContext('/v1/files'), next as any),
    );

    expect(result).toBe(file);
  });
});
