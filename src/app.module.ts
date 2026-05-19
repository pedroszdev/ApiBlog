import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './User/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { PostModule } from './Post/post.module';
import { AuthModule } from './Auth/auth.module';
import { CommentsModule } from './Comments/comments.module';
import { LikesModule } from 'Likes/likes.module';

@Module({
  imports: [UserModule, PrismaModule, PostModule, AuthModule, CommentsModule, LikesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
