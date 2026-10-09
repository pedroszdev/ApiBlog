import {
  ArgumentMetadata,
  HttpException,
  HttpStatus,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PageValidationPipe implements PipeTransform {
  constructor(private readonly prisma: PrismaService) {}

  async transform(
    value: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    metadata: ArgumentMetadata,
  ) {
    console.log(typeof value)
    if ( value < 1 ) {
        console.log('entrou')
        throw new HttpException('Page tem que ser maior ou igual a 1', HttpStatus.BAD_REQUEST)
    }
    console.log('pulou if')
    return value
  }
}

@Injectable()
export class LimitValidationPipe implements PipeTransform {
  constructor(private readonly prisma: PrismaService) {}

  async transform(
    value: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    metadata: ArgumentMetadata,
  ) {
    if ( value > 50 || value < 1) {
        throw new HttpException('limite tem que ser menor ou igual a 50 e maior que 0', HttpStatus.BAD_REQUEST)
    }
    return value
  }
}