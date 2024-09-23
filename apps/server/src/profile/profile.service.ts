import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Subscription } from '../subscription/subscription.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async getProfileData(
    userId: number,
  ): Promise<{ email: string; subscription: Subscription | null }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    const subscription = await this.subscriptionRepository.findOne({
      where: { user: { id: userId }, status: 'active' },
    });

    return {
      email: user.email,
      subscription,
    };
  }
}
