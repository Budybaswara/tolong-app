import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

class FirebaseLoginDto {
  @IsString()
  @MinLength(20)
  idToken!: string;
}

class GuestDto {
  @IsOptional()
  @IsString()
  displayName?: string;
}

class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

class FcmTokenDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsIn(['android', 'ios', 'web'])
  platform!: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('firebase')
  firebase(@Body() dto: FirebaseLoginDto) {
    return this.auth.loginWithFirebase(dto.idToken);
  }

  @Post('guest')
  guest(@Body() dto: GuestDto) {
    return this.auth.guest(dto.displayName);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @ApiBearerAuth()
  @Post('logout')
  async logout(@Headers('authorization') authorization?: string) {
    const user = await this.auth.verifyAccessToken(authorization);
    return this.auth.logout(user.id);
  }

  @ApiBearerAuth()
  @Post('fcm-token')
  async registerFcm(@Headers('authorization') authorization: string | undefined, @Body() dto: FcmTokenDto) {
    const user = await this.auth.verifyAccessToken(authorization);
    return this.auth.registerFcmToken(user.id, dto.token, dto.platform);
  }
}
