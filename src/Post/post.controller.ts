import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { PostGuard } from './post.guard';
import { AuthGuard } from 'src/Auth/auth.guard';
import { TokenPayload } from 'src/Auth/tokenPayload';
type NewType = RequestWithUser;

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
  createPost(@Body() postDto: CreatePostDto, @Req() req: NewType) {
    const user = req.user;
    const sub = user.sub;
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
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.postService.deletePost(id);
  }
}

interface RequestWithUser extends Request {
  user: TokenPayload;
}
