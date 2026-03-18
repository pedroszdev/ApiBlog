import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    const data = { ...createUserDto };
    if (Object.keys(data).length === 0) {
      throw new HttpException(
        'Precisa ser enviado algum parametro',
        HttpStatus.BAD_REQUEST,
      );
    }
    const user = await this.prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (user) {
      throw new HttpException('Email já utilizado', HttpStatus.BAD_REQUEST);
    }

    if (data.password.length < 8) {
      throw new HttpException(
        'Senha precisa ter mais de 8 caracteres',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (data.name.length < 3) {
      throw new HttpException(
        'Nome precisa ter mais de 3 digitos',
        HttpStatus.BAD_REQUEST,
      );
    }

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

  async findAllUser() {
    const users = await this.prisma.user.findMany();

    return users;
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

  async updateUser(id: number, createUserDto: CreateUserDto) {
    const data = { ...createUserDto };
    const user = await this.prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!user) {
      throw new HttpException('Usuario não encontrado', HttpStatus.NOT_FOUND);
    }

    if (data.password.length < 8) {
      throw new HttpException(
        'Senha precisa ter mais de 8 caracteres',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (data.name.length < 3) {
      throw new HttpException(
        'Nome precisa ter mais de 3 digitos',
        HttpStatus.BAD_REQUEST,
      );
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltRounds,
    );

    const UpdateUser = await this.prisma.user.update({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        password: hashedPassword,
      },
      where: {
        id: id,
      },
    });

    return UpdateUser;
  }

  async deleteUser(id: number) {
    await this.prisma.user.delete({
      where: {
        id: id,
      },
    });

    return 'Usuario Apagado';
  }
}
