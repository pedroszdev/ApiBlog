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
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { CreateUserValidationPipe } from './userValidation.pipe';
import { UserGuard } from './user.guard';

@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @Get()
  // findAll() {
  //   return this.userService.findAllUser();
  // }

  @Get(':id')
  @UseGuards(UserGuard)
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findByIdUser(id);
  }

  @Post()
  createUser(@Body(CreateUserValidationPipe) createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Put(':id')
  @UseGuards(UserGuard)
  updateById(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(UserGuard)
  deleteById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deleteUser(id);
  }
}
