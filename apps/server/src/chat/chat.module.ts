import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatMessage } from './chat-message.entity';
import { User } from '../user/user.entity';
import { ChatController } from './chat.controller';
import { JwtModule } from '@nestjs/jwt';
import { DirectusModule } from 'src/directus/directus.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage, User]),
    JwtModule,
    DirectusModule,
  ],
  providers: [ChatService, ChatGateway],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}
