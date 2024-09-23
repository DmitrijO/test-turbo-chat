import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody()
    message: {
      senderId: number;
      receiverId: number;
      content: string;
    },
  ): Promise<void> {
    const savedMessage = await this.chatService.saveMessage(
      message.senderId,
      message.receiverId,
      message.content,
    );

    this.server
      .to(`user_${message.senderId}`)
      .emit('receiveMessage', savedMessage);
    this.server
      .to(`user_${message.receiverId}`)
      .emit('receiveMessage', savedMessage);
  }

  @SubscribeMessage('joinChat')
  handleJoinChat(
    @MessageBody('userId') userId: number,
    @ConnectedSocket() client: Socket,
  ): void {
    client.join(`user_${userId}`);
  }
}
