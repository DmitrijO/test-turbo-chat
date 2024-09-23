import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './chat-message.entity';
import { User } from '../user/user.entity';
import { DirectusService } from 'src/directus/directus.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private directusService: DirectusService,
  ) {}

  async saveMessage(
    senderId: number,
    receiverId: number,
    content: string,
  ): Promise<ChatMessage> {
    const sender = await this.userRepository.findOne({
      where: { id: senderId },
    });
    const receiver = await this.userRepository.findOne({
      where: { id: receiverId },
    });

    const message = this.chatMessageRepository.create({
      content,
      sender,
      receiver,
    });

    await this.directusService.createChatMessage(
      sender.email,
      receiver.email,
      content,
    );

    return this.chatMessageRepository.save(message);
  }

  async getChatHistory(
    userId1: number,
    userId2: number,
  ): Promise<ChatMessage[]> {
    return this.chatMessageRepository.find({
      where: [
        { sender: { id: userId1 }, receiver: { id: userId2 } },
        { sender: { id: userId2 }, receiver: { id: userId1 } },
      ],
      relations: ['sender', 'receiver'],
      order: { timestamp: 'ASC' },
    });
  }
}
