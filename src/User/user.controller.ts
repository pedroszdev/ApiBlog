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
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { CreateUserValidationPipe } from './userValidation.pipe';
import { UserGuard } from './user.guard';
import { AuthGuard } from '../Auth/auth.guard';

@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @Get()
  // findAll() {
  //   return this.userService.findAllUser();
  // }

  @Get(':id')
  @UseGuards(AuthGuard, UserGuard)
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findByIdUser(id);
  }

  @Post()
  createUser(@Body(CreateUserValidationPipe) createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Put(':id')
  @UseGuards(AuthGuard, UserGuard)
  updateById(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, UserGuard)
  @HttpCode(204)
  deleteById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deleteUser(id);
  }
}
