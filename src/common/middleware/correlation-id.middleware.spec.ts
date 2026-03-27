import { CorrelationIdMiddleware } from './correlation-id.middleware';

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
  });

  it('should reuse incoming x-correlation-id header', () => {
    const req: any = { headers: { 'x-correlation-id': 'upstream-id' } };
    const res: any = { setHeader: jest.fn() };
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.correlationId).toBe('upstream-id');
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Correlation-ID',
      'upstream-id',
    );
    expect(next).toHaveBeenCalled();
  });

  it('should create correlation id when header is missing', () => {
    const req: any = { headers: {} };
    const res: any = { setHeader: jest.fn() };
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(typeof req.correlationId).toBe('string');
    expect(req.correlationId.length).toBeGreaterThan(0);
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Correlation-ID',
      req.correlationId,
    );
    expect(next).toHaveBeenCalled();
  });
});
