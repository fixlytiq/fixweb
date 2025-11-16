import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPayload } from '../types';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

