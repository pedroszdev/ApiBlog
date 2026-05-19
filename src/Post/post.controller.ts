import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { PostGuard } from './post.guard';
import { AuthGuard } from '../Auth/auth.guard';
import { OptionalAuthGuard } from '../Auth/optionalAuth.guard';
import { OptionalUserId, UserId } from './post.decorator';

@Controller('/post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  findAll() {
    return this.postService.findAll();
  }

  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  findById(
    @Param('id', ParseIntPipe) id: number,
    @OptionalUserId() userId: number | undefined,
  ) {
    return this.postService.findById(id, userId);
  }

  @Post()
  @UseGuards(AuthGuard)
  createPost(@Body() postDto: CreatePostDto, @UserId() sub: number) {
    return this.postService.createPost(sub, postDto);
  }

  @Put(':id')
  @UseGuards(AuthGuard, PostGuard)
  updatepost(
    @Param('id', ParseIntPipe) id: number,
    @Body() postDto: UpdatePostDto,
  ) {
    return this.postService.updatePost(id, postDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, PostGuard)
  @HttpCode(204)
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.postService.deletePost(id);
  }
}
