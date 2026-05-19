import { HttpException, Injectable } from "@nestjs/common";
import { LikesDto } from "./dto/likes.dto";
import { PrismaService } from "prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class LikesService {
    constructor(private readonly prisma: PrismaService) {}
    
    async likePost(data: LikesDto, userId: number) {
        if (data.postId) {
            const post = await this.prisma.post.findUnique({
                where: {
                    id: data.postId,
                }
            })
            if (!post) {
                throw new HttpException('post não existe', 400)
            }
            try {
                const like = await this.prisma.likes.create({
                    data: {
                        postId: data.postId,
                        authorId: userId,  
                    }
                })
                return like
            } catch (e) {
                // P2002 = unique constraint violation
                if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                    throw new HttpException('Você já curtiu', 409)
                }
                throw e
            }
        }
        
        throw new HttpException('Necessario mandar postId', 400)

    }

    async unLikePost(data: LikesDto, userId: number) {
        if (data.postId) {
            const like = await this.prisma.likes.findFirst({
                where: {
                    postId: data.postId,
                    authorId: userId, 
                }
            })
            if (!like) {
                throw new HttpException('like não existe', 400)
            }
            await this.prisma.likes.deleteMany({
                where: {
                    postId: data.postId,
                    authorId: userId,
                }
            }) 
            return { message: 'descurtido' }
        }
        
        throw new HttpException('Necessario mandar postId', 400)

    }  

    async likeComment(data: LikesDto, userId: number) {
        if (data.commentId) {
            const comment = await this.prisma.comments.findUnique({
                where: {
                    id: data.commentId,
                }
            })
            if (!comment) {
                throw new HttpException('comentario não existe', 400)
            }
            try {
                const like = await this.prisma.likes.create({
                    data: {
                        commentId: data.commentId,
                        authorId: userId, 
                    }
                })
                return like
            } catch (e) {
                // P2002 = unique constraint violation
                if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                    throw new HttpException('Você já curtiu', 409)
                }
                throw e
            }
        }
        
        throw new HttpException('Necessario mandar commentId', 400)

    }

    async unLikeComment(data: LikesDto, userId: number) {
        if (data.commentId) {
            const like = await this.prisma.likes.findFirst({
                where: {
                    commentId: data.commentId,
                    authorId: userId, 
                }
            })
            if (!like) {
                throw new HttpException('like não existe', 400)
            }
            await this.prisma.likes.deleteMany({
                where: {
                    commentId: data.commentId,
                    authorId: userId,
                }
            }) 
            return { message: 'descurtido' }
        }
        
        throw new HttpException('Necessario mandar commentId', 400)

    }  

}