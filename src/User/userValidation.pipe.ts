import {
  ArgumentMetadata,
  BadRequestException,
  ConflictException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class CreateUserValidationPipe implements PipeTransform {
  constructor(private readonly prisma: PrismaService) {}

  async transform(
    value: CreateUserDto | UpdateUserDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    metadata: ArgumentMetadata,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: value.email,
      },
    });

    if (user) {
      throw new ConflictException('Email já utilizado');
    }

    const validatorPassowrd =
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!%$*&@#])(?:([0-9a-zA-Z!%$*&@#])(?!\1)){8,}$/i;

    if (value.password && !validatorPassowrd.test(value.password)) {
      throw new BadRequestException(
        'Senha precisa ter no mínimo 8 caracteres, 1 letra maiúscula no mínimo, 1 número no mínimo, 1 caracter especial no mínimo e não é permitido sequência igual (aa, bb, 44, etc)',
      );
    }
    return value;
  }
}
