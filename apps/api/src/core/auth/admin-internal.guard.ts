import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyRequest } from 'fastify';

@Injectable()
export class AdminInternalGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const expected = this.config.get<string>('API_INTERNAL_TOKEN', 'change-this-internal-api-token');

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const actual = request.headers['x-api-internal-token'];
    if (actual !== expected) throw new UnauthorizedException('Admin API token tidak valid');
    return true;
  }
}
