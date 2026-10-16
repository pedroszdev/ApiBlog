import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  ParseIntPipe,
  Put,
  Delete,
  UseGuards,
  HttpCode,
  UseInterceptors,
  SerializeOptions,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { AuthorEntity, CreateUserDto, UpdateUserDto, UserEntity } from './dto/user.dto';
import { CreateUserValidationPipe } from './userValidation.pipe';
import { UserGuard } from './user.guard';
import { AuthGuard } from '../Auth/auth.guard';
import { UserId } from '../Post/post.decorator';

@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @Get()
  // findAll() {
  //   return this.userService.findAllUser();
  // }


  @Get('me')
  @UseInterceptors(ClassSerializerInterceptor) // para o serialize funcionar
  @SerializeOptions({ type: UserEntity }) // para apagar o password do response
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  findMe(@UserId() id: number) {
    return this.userService.findByIdUser(id);
  }

  @Get(':id')
  @UseInterceptors(ClassSerializerInterceptor) // para o serialize funcionar
  @SerializeOptions({ type: UserEntity }) // para apagar o password do response
  @ApiBearerAuth()
  @UseGuards(AuthGuard, UserGuard)
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findByIdUser(id);
  }

  @Get('/author/:id')
  @UseInterceptors(ClassSerializerInterceptor) // para o serialize funcionar
  @SerializeOptions({ type: AuthorEntity }) // para apagar o password do response
  @ApiBearerAuth()
  findAuthor(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findByIdUser(id);
  }
  

  @Post()
  @UseInterceptors(ClassSerializerInterceptor) // para o serialize funcionar
  @SerializeOptions({ type: UserEntity }) // para apagar o password do response
  createUser(@Body(CreateUserValidationPipe) createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, UserGuard)
  @UseInterceptors(ClassSerializerInterceptor) // para o serialize funcionar
  @SerializeOptions({ type: UserEntity }) // para apagar o password do response
  updateById(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, UserGuard)
  @HttpCode(204)
  deleteById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deleteUser(id);
  }
}
