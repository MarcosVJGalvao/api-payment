import { shouldSkipResponseTransform } from './response-transform-skip.helper';

describe('shouldSkipResponseTransform', () => {
  it('should skip docs and openapi routes', () => {
    expect(shouldSkipResponseTransform({ path: '/api/docs' })).toBe(true);
    expect(shouldSkipResponseTransform({ path: '/api/docs/openapi.json' })).toBe(
      true,
    );
    expect(shouldSkipResponseTransform({ path: '/api-json' })).toBe(true);
  });

  it('should skip download and export routes', () => {
    expect(shouldSkipResponseTransform({ path: '/v1/reports/download' })).toBe(
      true,
    );
    expect(shouldSkipResponseTransform({ path: '/v1/reports/export' })).toBe(
      true,
    );
  });

  it('should skip reports post route', () => {
    expect(
      shouldSkipResponseTransform({ path: '/reports', method: 'POST' }),
    ).toBe(true);
  });

  it('should not skip regular routes', () => {
    expect(
      shouldSkipResponseTransform({ path: '/financial-providers', method: 'GET' }),
    ).toBe(false);
  });
});
