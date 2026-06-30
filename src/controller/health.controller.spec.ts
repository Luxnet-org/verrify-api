import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns app health status', () => {
    const controller = new HealthController();

    expect(controller.check()).toEqual({
      status: 'ok',
      service: 'verrify-api',
    });
  });
});
