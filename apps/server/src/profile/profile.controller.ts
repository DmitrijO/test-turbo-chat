import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { ProfileService } from './profile.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@Req() req: Request) {
    const userId = req.user['sub'];
    const profile = await this.profileService.getProfileData(userId);
    return profile;
  }
}
