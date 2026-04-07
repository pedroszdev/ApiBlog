import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Response } from 'express';

@Injectable()
export class DataInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const response: Response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data: undefined) => {
        return {
          status: response.statusCode,
          data: data,
        };
      }),
    );
  }
}
