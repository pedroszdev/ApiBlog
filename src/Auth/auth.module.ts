import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../User/user.module';

@Module({
  imports: [
    ConfigModule,
    UserModule, // 👈 importa para poder exportar
    JwtModule.registerAsync({
      global: true, // 👈 JwtService disponível em todo o app
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');

        if (!secret) {
          throw new Error('JWT_SECRET não encontrada no arquivo .env');
        }

        return {
          secret,
          signOptions: { expiresIn: '15m' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [UserModule], // 👈 JwtModule não precisa mais (é global)
})
export class AuthModule {}
