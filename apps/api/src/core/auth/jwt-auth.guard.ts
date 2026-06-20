import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../../features/auth/auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private auth: AuthService) {}

  async canActivate(ctx: ExecutionContext) {
    const request = ctx.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; user?: unknown }>();
    request.user = await this.auth.verifyAccessToken(request.headers.authorization);
    return true;
  }
}
