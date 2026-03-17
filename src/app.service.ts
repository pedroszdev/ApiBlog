import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { nome: { name: string } } {
    const nome: { name: string } = { name: 'pedro' };
    console.log(nome);
    return {
      nome,
    };
  }
}
