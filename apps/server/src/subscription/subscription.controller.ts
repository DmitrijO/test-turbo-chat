import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  private stripe: Stripe;

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    });
  }

  @Post('create')
  async createSubscription(
    @Req() req: Request,
    @Body('plan') plan: string,
    @Body('paymentMethodId') paymentMethodId: string,
  ) {
    const userId = req.user['sub'];
    return this.subscriptionService.createSubscription(
      userId,
      plan,
      paymentMethodId,
    );
  }

  @Post('create-session')
  async createStripeSession(
    @Req() req: Request,
    @Body('plan') plan: string,
  ): Promise<{ clientSecret: string }> {
    const userId = req.user['sub'];
    return this.subscriptionService.createStripeSession(userId, plan);
  }

  @Get()
  async getUserSubscriptions(@Req() req: Request) {
    const userId = req.user['sub'];

    return this.subscriptionService.getUserSubscriptions(userId);
  }

  @Post('cancel')
  async cancelSubscription(@Req() req: Request) {
    const userId = req.user['sub'];
    return this.subscriptionService.cancelSubscription(userId);
  }
}
