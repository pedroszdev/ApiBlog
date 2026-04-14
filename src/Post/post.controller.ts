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
import { AuthGuard } from 'src/Auth/auth.guard';
import { UserId } from './post.decorator';

@Controller('/post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  findAll() {
    return this.postService.findAll();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.postService.findById(id);
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
