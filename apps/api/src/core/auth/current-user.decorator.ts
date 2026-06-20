import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type CurrentUser = {
  id: string;
  role: string;
  displayName: string;
  email?: string | null;
  phone?: string | null;
};

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest<{ user?: CurrentUser }>().user;
});
