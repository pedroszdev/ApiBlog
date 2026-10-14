import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { LikesService } from './likes.service';
import { AuthGuard } from '../Auth/auth.guard';
import { LikesDto } from './dto/likes.dto';
import { UserId } from '../Post/post.decorator';

@ApiBearerAuth()
@Controller('/like')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('/comment')
  @UseGuards(AuthGuard)
  likeComment(@Body() data: LikesDto, @UserId() userId: number) {
    return this.likesService.likeComment(data, userId);
  }

  @Delete('/comment')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  unLikeComment(@Body() data: LikesDto, @UserId() userId: number) {
    return this.likesService.unLikeComment(data, userId);
  }

  @Post('/post')
  @UseGuards(AuthGuard)
  likePost(@Body() data: LikesDto, @UserId() userId: number) {
    return this.likesService.likePost(data, userId);
  }

  @Delete('/post')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  unLikePost(@Body() data: LikesDto, @UserId() userId: number) {
    return this.likesService.unLikePost(data, userId);
  }
}
