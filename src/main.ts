import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DataInterceptor } from './app.interceptors';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { PrismaExceptionFilter } from './app.filter';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 1);

  app.use(helmet());
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new DataInterceptor());
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.use(cookieParser());

  // para habilitar a documentação pelo swagger
  const config = new DocumentBuilder()
    .setTitle('Api Blog')
    .setDescription('Documentação da api do blog')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('documentacao', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
