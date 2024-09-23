import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createDirectus,
  authentication,
  rest,
  createItem,
  createCollection,
  readCollection,
  updateItem,
  readItems,
} from '@directus/sdk';
import { randomUUID } from 'crypto';

@Injectable()
export class DirectusService {
  private directusClient;
  private adminEmail: string;
  private adminPassword: string;

  constructor(private readonly configService: ConfigService) {
    this.adminEmail = this.configService.get<string>('DIRECTUS_ADMIN_EMAIL');
    this.adminPassword = this.configService.get<string>(
      'DIRECTUS_ADMIN_PASSWORD',
    );
    const adminUrl = this.configService.get<string>('DIRECTUS_ADMIN_URL');

    this.directusClient = createDirectus(adminUrl)
      .with(authentication('json'))
      .with(rest());
  }

  async authenticate(): Promise<void> {
    try {
      await this.directusClient.login(this.adminEmail, this.adminPassword);
    } catch (error) {
      console.error('Failed to auth with directus:', error);
      throw error;
    }
  }

  async ensureAuthenticated(): Promise<void> {
    const token = this.directusClient?.auth?.token;
    const tokenExpiry = this.directusClient?.auth?.expires_at;

    if (!token || Date.now() >= tokenExpiry) {
      await this.authenticate();
    }
  }

  async createCollectionIfNotExists(collectionObject: any): Promise<any> {
    await this.ensureAuthenticated();

    try {
      try {
        await this.directusClient.request(
          readCollection(collectionObject.collection),
        );
      } catch (error) {
        console.log(error);
        console.log(
          `Collection "${collectionObject.collection}" does not exist. Start to creating`,
        );

        const result = await this.directusClient.request(
          createCollection(collectionObject),
        );

        console.log(
          `Collection "${collectionObject.collection}" created:`,
          result,
        );
        return result;
      }
    } catch (error) {
      console.error(
        `Error whiile checking or creating collection: "${collectionObject.collection}":`,
        error,
      );
      throw error;
    }
  }

  async createUser(email: string): Promise<any> {
    await this.ensureAuthenticated();

    const userCollectionObject = {
      collection: 'users',
      meta: {
        collection: 'users',
        icon: 'person',
        note: 'Users',
        hidden: false,
        singleton: false,
      },
      schema: { name: 'users' },
      fields: [
        {
          field: 'email',
          type: 'string',
          meta: { icon: 'email' },
          schema: { is_nullable: false, is_primary_key: true },
        },
        {
          field: 'created_at',
          type: 'date',
          meta: {
            readonly: true,
          },
          schema: { is_nullable: false },
        },
      ],
    };

    await this.createCollectionIfNotExists(userCollectionObject);

    try {
      const response = await this.directusClient.request(
        // @ts-expect-error: Some types errors
        createItem('users', { email, created_at: new Date() }),
      );

      return response;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async createChatMessage(
    senderEmail: string,
    receiverEmail: string,
    content: string,
  ): Promise<any> {
    await this.ensureAuthenticated();

    const chatMessageCollectionObject = {
      collection: 'messages',
      meta: {
        collection: 'messages',
        icon: 'chat',
        note: 'Messages',
        hidden: false,
        singleton: false,
      },
      schema: { name: 'messages' },
      fields: [
        {
          field: 'id',
          type: 'uuid',
          meta: { interface: 'input' },
          schema: {
            is_primary_key: true,
            is_nullable: false,
            is_auto_increment: true,
          },
        },
        { field: 'sender', type: 'string', meta: { interface: 'email' } },
        { field: 'receiver', type: 'string', meta: { interface: 'email' } },
        { field: 'content', type: 'string', meta: { interface: 'textarea' } },
      ],
    };

    await this.createCollectionIfNotExists(chatMessageCollectionObject);

    try {
      const response = await this.directusClient.request(
        // @ts-expect-error: Some types errors
        createItem('messages', {
          id: randomUUID(),
          sender: senderEmail,
          receiver: receiverEmail,
          content,
        }),
      );

      return response;
    } catch (error) {
      console.error('Error creating chat message:', error);
      throw error;
    }
  }

  async cancelSubscription(userEmail): Promise<any> {
    await this.ensureAuthenticated();

    try {
      const response = await this.directusClient.request(
        // @ts-expect-error: Some types errors
        readItems('subscriptions', {
          filter: {
            user: { _eq: userEmail },
            status: { _eq: 'active' },
          },
        }),
      );

      if (!response.length) {
        throw new Error(`Active subscription not found.`);
      }

      const activeSubscription = response[0];

      const responseUpdated = await this.directusClient.request(
        // @ts-expect-error: Some types errors
        updateItem('subscriptions', activeSubscription.id, {
          ...activeSubscription,
          status: 'canceled',
          end_date: new Date(),
        }),
      );

      return responseUpdated;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  async createSubscription(
    userEmail: string,
    plan: string,
    startDate: Date,
    endDate: Date,
    status: string,
  ): Promise<any> {
    await this.ensureAuthenticated();

    const subscriptionCollectionObject = {
      collection: 'subscriptions',
      meta: {
        collection: 'subscriptions',
        icon: 'subscriptions',
        note: 'User subscriptions collection',
        hidden: false,
        singleton: false,
        translations: [{ language: 'en-US', translation: 'Subscriptions' }],
      },
      schema: { name: 'subscriptions' },
      fields: [
        {
          field: 'id',
          type: 'uuid',
          meta: { interface: 'input' },
          schema: {
            is_primary_key: true,
            is_nullable: false,
            is_auto_increment: true,
          },
        },
        { field: 'user', type: 'string', meta: { interface: 'email' } },
        { field: 'plan', type: 'string', meta: { interface: 'input' } },
        {
          field: 'start_date',
          type: 'dateTime',
          meta: { interface: 'datetime' },
        },
        {
          field: 'end_date',
          type: 'dateTime',
          meta: { interface: 'datetime' },
        },
        { field: 'status', type: 'string', meta: { interface: 'input' } },
      ],
    };

    await this.createCollectionIfNotExists(subscriptionCollectionObject);

    try {
      const response = await this.directusClient.request(
        // @ts-expect-error: Some types errors
        createItem('subscriptions', {
          id: randomUUID(),
          user: userEmail,
          plan,
          start_date: startDate,
          end_date: endDate,
          status,
        }),
      );

      return response;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }
}
