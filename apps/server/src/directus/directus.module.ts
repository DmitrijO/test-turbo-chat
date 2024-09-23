import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { DirectusService } from './directus.service';

@Module({
  imports: [HttpModule, ConfigModule.forRoot()],
  providers: [DirectusService],
  exports: [DirectusService],
})
export class DirectusModule {}
