import {
  HttpException,
  HttpStatus,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class PageValidationPipe implements PipeTransform {
  transform(value: number) {
    if (value < 1) {
      throw new HttpException(
        'Page tem que ser maior ou igual a 1',
        HttpStatus.BAD_REQUEST,
      );
    }
    return value;
  }
}

@Injectable()
export class LimitValidationPipe implements PipeTransform {
  transform(value: number) {
    if (value > 50 || value < 1) {
      throw new HttpException(
        'limite tem que ser menor ou igual a 50 e maior que 0',
        HttpStatus.BAD_REQUEST,
      );
    }
    return value;
  }
}
