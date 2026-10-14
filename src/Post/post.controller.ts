import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { PostGuard } from './post.guard';
import { AuthGuard } from '../Auth/auth.guard';
import { OptionalAuthGuard } from '../Auth/optionalAuth.guard';
import { OptionalUserId, UserId } from './post.decorator';
import { LimitValidationPipe, PageValidationPipe } from './postValidation.pipe';

@Controller('/post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe, PageValidationPipe)
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe, LimitValidationPipe)
    limit: number,
  ) {
    return this.postService.findAll(page, limit);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(OptionalAuthGuard)
  findById(
    @Param('id', ParseIntPipe) id: number,
    @OptionalUserId() userId: number | undefined,
  ) {
    return this.postService.findById(id, userId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  createPost(@Body() postDto: CreatePostDto, @UserId() sub: number) {
    return this.postService.createPost(sub, postDto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, PostGuard)
  updatepost(
    @Param('id', ParseIntPipe) id: number,
    @Body() postDto: UpdatePostDto,
  ) {
    return this.postService.updatePost(id, postDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, PostGuard)
  @HttpCode(204)
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.postService.deletePost(id);
  }
}
