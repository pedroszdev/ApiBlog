import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './User/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { PostModule } from './Post/post.module';
import { AuthModule } from './Auth/auth.module';
import { CommentsModule } from './Comments/comments.module';
import { LikesModule } from './Likes/likes.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    UserModule,
    PrismaModule,
    PostModule,
    AuthModule,
    CommentsModule,
    LikesModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
