import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import type { Request } from 'express';
import { PrismaService } from './prisma/prisma.service';
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Post()
  oia(): string {
    return 'x';
  }
}
