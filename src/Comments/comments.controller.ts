import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentDto } from './dto/comments.dto';
import { UserId } from 'src/Post/post.decorator';
import { AuthGuard } from 'src/Auth/auth.guard';
import { CommentValidationPipe } from './comments.pipe';
import { CommentGuard } from './comment.guard';

@Controller('/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UsePipes(CommentValidationPipe)
  createcomment(@Body() comment: CommentDto, @UserId() userId: number) {
    return this.commentsService.createComment(comment, userId);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard, CommentGuard)
  @HttpCode(204)
  deleteComment(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.deleteComment(id);
  }
}
