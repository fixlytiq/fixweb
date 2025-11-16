import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { StoreRole } from '@prisma/client';
import { UserPayload } from '../types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
    });
  }

  validate(payload: { sub?: string; employeeId?: string; storeId: string; role: StoreRole }): UserPayload {
    // Handle both payload structures (sub from JWT subject, or employeeId directly)
    const employeeId = payload.employeeId || payload.sub;
    if (!employeeId || !payload.storeId || !payload.role) {
      throw new UnauthorizedException('Invalid JWT payload structure');
    }
    return {
      employeeId,
      storeId: payload.storeId,
      role: payload.role,
    };
  }
}

