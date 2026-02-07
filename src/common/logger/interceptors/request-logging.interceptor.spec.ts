import { ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AppLoggerService } from '../logger.service';
import { RequestLoggingInterceptor } from './request-logging.interceptor';

describe('RequestLoggingInterceptor', () => {
  let interceptor: RequestLoggingInterceptor;
  let logger: Pick<AppLoggerService, 'logWithContext'>;

  beforeEach(() => {
    logger = {
      logWithContext: jest.fn(),
    };
    interceptor = new RequestLoggingInterceptor(logger as AppLoggerService);
  });

  function createContext(statusCode = 200): {
    context: ExecutionContext;
    getFinishHandler: () => (() => void) | undefined;
    response: any;
  } {
    let finishHandler: (() => void) | undefined;
    const response = {
      statusCode,
      once: jest.fn((_event: string, handler: () => void) => {
        finishHandler = handler;
      }),
      getHeaders: jest.fn().mockReturnValue({
        'content-type': 'application/json',
        etag: 'abc',
        'x-custom': '1',
      }),
    };
    const request = {
      method: 'GET',
      url: '/payments?x=1',
      headers: { authorization: 'Bearer token' },
      query: {},
      params: {},
      body: {},
      correlationId: 'cid-1',
    };
    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
        getResponse: jest.fn().mockReturnValue(response),
      }),
    } as unknown as ExecutionContext;

    return { context, getFinishHandler: () => finishHandler, response };
  }

  it('should log successful requests only', async () => {
    const state = createContext(200);
    await firstValueFrom(
      interceptor.intercept(state.context, { handle: () => of({ ok: true }) } as any),
    );
    state.getFinishHandler()?.();

    expect(logger.logWithContext).toHaveBeenCalledTimes(1);
    expect(logger.logWithContext).toHaveBeenCalledWith(
      'log',
      expect.stringContaining('HTTP Request Success'),
      expect.objectContaining({
        statusCode: 200,
      }),
      expect.any(String),
    );
  });

  it('should not log non-2xx requests', async () => {
    const state = createContext(500);
    await firstValueFrom(
      interceptor.intercept(
        state.context,
        { handle: () => throwError(() => new Error('boom')) } as any,
      ).pipe(),
    ).catch(() => undefined);
    state.getFinishHandler()?.();

    expect(logger.logWithContext).not.toHaveBeenCalled();
  });
});
