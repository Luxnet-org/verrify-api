import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorator/public.decorator';

interface HealthResponse {
  status: 'ok';
  service: 'verrify-api';
}

@Public()
@Controller('health')
export class HealthController {
  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      service: 'verrify-api',
    };
  }
}
