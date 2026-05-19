import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentDto } from './dto/comments.dto';
import { UserId } from '../Post/post.decorator';
import { AuthGuard } from '../Auth/auth.guard';
import { CommentValidationPipe } from './comments.pipe';
import { CommentGuard } from './comment.guard';

@Controller('/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(AuthGuard)
  createcomment(
    @Body(CommentValidationPipe) comment: CommentDto,
    @UserId() userId: number,
  ) {
    return this.commentsService.createComment(comment, userId);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard, CommentGuard)
  @HttpCode(204)
  deleteComment(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.deleteComment(id);
  }

  @Post('/:parentId/replies')
  @UseGuards(AuthGuard)
  createReplies(
    @Body(CommentValidationPipe) comment: CommentDto,
    @Param('parentId', ParseIntPipe) parentId: number,
    @UserId() userId: number,
  ) {
    return this.commentsService.repliesComment(comment, parentId, userId);
  }
}
