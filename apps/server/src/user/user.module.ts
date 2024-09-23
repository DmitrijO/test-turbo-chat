import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { JwtModule } from '@nestjs/jwt';
import { UsersController } from './users.controller';
import { DirectusModule } from 'src/directus/directus.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '260m' },
      }),
      inject: [ConfigService],
    }),
    DirectusModule,
  ],
  providers: [UserService],
  controllers: [UserController, UsersController],
})
export class UserModule {}
