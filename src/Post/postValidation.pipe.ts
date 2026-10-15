import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class PageValidationPipe implements PipeTransform {
  transform(value: number) {
    if (value < 1) {
      throw new BadRequestException('Page tem que ser maior ou igual a 1');
    }
    return value;
  }
}

@Injectable()
export class LimitValidationPipe implements PipeTransform {
  transform(value: number) {
    if (value > 50 || value < 1) {
      throw new BadRequestException(
        'limite tem que ser menor ou igual a 50 e maior que 0',
      );
    }
    return value;
  }
}

@Injectable()
export class SortValidationPipe implements PipeTransform {
  transform(value: string) {
    const sortsAceitos = ['asc', 'desc']
    if (!sortsAceitos.includes(value)) {
      throw new BadRequestException(
        'Sort tem que ser asc ou desc',
      );
    }
    return value;
  }
}

@Injectable()
export class IdLimitValidationPipe implements PipeTransform {
  transform(value: number) {
    if (value > 2147483647) {
      throw new BadRequestException('id tem que ser menor que 2147483647')
    }
    return value;
  }
}