import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DataInterceptor } from './app.interceptors';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new DataInterceptor());
  app.use(cookieParser());

  // para habilitar a documentação pelo swagger
  const config = new DocumentBuilder()
    .setTitle('Api Agenda')
    .setDescription('Documentação da api da agenda')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('documentacao', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);

}

void bootstrap();
