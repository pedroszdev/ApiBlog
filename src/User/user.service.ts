import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltRounds,
    );

    const newUser = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        password: hashedPassword,
      },
    });

    return newUser;
  }

  async findByIdUser(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        posts: true,
      },
    });

    if (!user) {
      throw new HttpException('Usuario não encontrado', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    const { ...data } = updateUserDto;

    const user = await this.prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!user) {
      throw new HttpException('Usuario não encontrado', HttpStatus.BAD_REQUEST);
    }
    if (updateUserDto?.password) {
      const validatorPassowrd =
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!%$*&@#])(?:([0-9a-zA-Z!%$*&@#])(?!\1)){8,}$/i;

      if (!validatorPassowrd.test(updateUserDto.password)) {
        console.log(validatorPassowrd.test(updateUserDto.password));
        throw new HttpException(
          'Senha precisa ter no mínimo 8 caracteres, 1 letra maiúscula no mínimo, 1 número no mínimo, 1 caracter especial no mínimo e não é permitido sequência igual (aa, bb, 44, etc)',
          HttpStatus.BAD_REQUEST,
        );
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(
        updateUserDto.password,
        saltRounds,
      );

      const UpdateUser = await this.prisma.user.update({
        data: {
          name: updateUserDto.name,
          email: updateUserDto.email,
          password: hashedPassword,
        },
        where: {
          id: id,
        },
      });

      return UpdateUser;
    } else {
      const UpdateUser = await this.prisma.user.update({
        data: data,
        where: {
          id: id,
        },
      });

      return UpdateUser;
    }
  }

  async deleteUser(id: number) {
    await this.prisma.user.delete({
      where: {
        id: id,
      },
    });

    return { message: 'User apagado' };
  }
}
