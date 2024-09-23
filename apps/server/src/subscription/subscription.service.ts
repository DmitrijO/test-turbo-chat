import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './subscription.entity';
import { User } from '../user/user.entity';
import { DirectusService } from 'src/directus/directus.service';
import { Stripe } from 'stripe';

@Injectable()
export class SubscriptionService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly directusService: DirectusService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
  }

  async createStripeSession(
    userId: number,
    plan: string,
  ): Promise<{ clientSecret: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const customer = await this.getOrCreateStripeCustomer(user.email);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: this.getPlanPrice(plan),
      currency: 'usd',
      customer,
      payment_method_types: ['card'],
    });

    return { clientSecret: paymentIntent.client_secret };
  }

  async createSubscription(
    userId: number,
    plan: string,
    paymentMethodId: string,
  ): Promise<Subscription> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const activeSubscription = await this.subscriptionRepository.findOne({
      where: { user: { id: userId }, status: 'active' },
    });

    if (activeSubscription) {
      await this.cancelStripeSubscription(
        activeSubscription.stripeSubscriptionId,
      );
      await this.directusService.cancelSubscription(user.email);
      activeSubscription.status = 'canceled';
      activeSubscription.endDate = new Date();
      await this.subscriptionRepository.save(activeSubscription);
    }

    const customer = await this.getOrCreateStripeCustomer(user.email);

    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer,
    });

    await this.stripe.customers.update(customer, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const stripeSubscription = await this.stripe.subscriptions.create({
      customer,
      items: [{ price: this.getPlanPriceId(plan) }],
      expand: ['latest_invoice.payment_intent'],
    });

    const newSubscription = new Subscription();
    newSubscription.user = user;
    newSubscription.plan = plan;
    newSubscription.startDate = new Date();
    newSubscription.endDate = new Date(
      newSubscription.startDate.getTime() + 30 * 24 * 60 * 60 * 1000,
    );
    newSubscription.status = 'active';
    newSubscription.stripeSubscriptionId = stripeSubscription.id;

    await this.directusService.createSubscription(
      user.email,
      plan,
      newSubscription.startDate,
      newSubscription.endDate,
      'active',
    );

    return this.subscriptionRepository.save(newSubscription);
  }

  async getUserSubscriptions(userId: number): Promise<Subscription[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.subscriptionRepository.find({
      where: { user },
    });
  }

  async cancelSubscription(userId: number): Promise<Subscription[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const activeSubscriptions = await this.subscriptionRepository.find({
      where: { user, status: 'active' },
    });

    if (activeSubscriptions.length === 0) {
      throw new Error('No active subscriptions found');
    }

    const canceledSubscriptions = await Promise.all(
      activeSubscriptions.map(async (subscription) => {
        await this.cancelStripeSubscription(subscription.stripeSubscriptionId);
        await this.directusService.cancelSubscription(user.email);
        subscription.status = 'canceled';
        subscription.endDate = new Date();
        return subscription;
      }),
    );

    return this.subscriptionRepository.save(canceledSubscriptions);
  }

  private async cancelStripeSubscription(
    stripeSubscriptionId: string,
  ): Promise<void> {
    if (!stripeSubscriptionId) {
      console.error('Invalid subscription ID');
      return;
    }

    try {
      await this.stripe.subscriptions.cancel(stripeSubscriptionId);
    } catch (error) {
      console.log(error);
    }
  }

  private async getOrCreateStripeCustomer(email: string): Promise<string> {
    const existingCustomers = await this.stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0].id;
    }

    const customer = await this.stripe.customers.create({ email });
    return customer.id;
  }

  private getPlanPriceId(plan: string): string {
    switch (plan) {
      case 'Basic':
        return 'price_1Q17bvH78kIalckfChd478Vq';
      case 'Standard':
        return 'price_1Q17bvH78kIalckfChd478Vq';
      case 'Premium':
        return 'price_1Q17bvH78kIalckfChd478Vq';
      default:
        throw new Error('Invalid plan');
    }
  }
  private getPlanPrice(plan: string): number {
    switch (plan) {
      case 'Basic':
        return 1000;
      case 'Standard':
        return 2000;
      case 'Premium':
        return 3000;
      default:
        throw new Error('Invalid plan');
    }
  }
}
