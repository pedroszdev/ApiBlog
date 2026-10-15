import { ArgumentsHost, BadRequestException, Catch, ConflictException, ExceptionFilter, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter  {
    private readonly logger = new Logger(PrismaExceptionFilter.name)

  catch(e: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {

    const map = {
      P2002: new ConflictException('Registro já existe'),
      P2025: new NotFoundException('Registro não encontrado'),
      P2003: new NotFoundException('Recurso relacionado não existe'),
      P2020: new BadRequestException('Valor fora do intervalo'),
    };

    const ex = map[e.code] ?? new InternalServerErrorException();
    this.logger.error(`Prisma ${e.code}: ${e.message}`, e.stack);
    host.switchToHttp().getResponse().status(ex.getStatus()).json(ex.getResponse());
  }

}