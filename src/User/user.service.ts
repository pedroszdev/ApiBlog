import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    const data = { ...createUserDto };
    if (Object.keys(data).length === 0) {
      return 'page 404';
    }
    const user = await this.prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (user) {
      return 'Email ja utilizado';
    }
    if (data.password.length < 8) {
      return 'Senha precisa ter 8 ou mais caracteres';
    }

    if (data.name.length < 3) {
      return 'Nome precisa ter mais de 3 digitos';
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
      return 'Page 404';
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
      return 'Usuario nao encontrado';
    }

    if (data.password.length < 8) {
      return 'Senha precisa ter 8 ou mais caracteres';
    }

    if (data.name.length < 3) {
      return 'Nome precisa ter mais de 3 digitos';
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
