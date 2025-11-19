import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { UserPayload } from '../auth/types';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@GetUser() user: UserPayload, @Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(user, createCategoryDto);
  }

  @Get()
  findAll(@GetUser() user: UserPayload) {
    return this.categoriesService.findAll(user);
  }

  @Get(':id')
  findOne(@GetUser() user: UserPayload, @Param('id') id: string, @Query('includeItems') includeItems?: string) {
    if (includeItems === 'true') {
      return this.categoriesService.findOneWithItems(user, id);
    }
    return this.categoriesService.findOne(user, id);
  }

  @Patch(':id')
  update(
    @GetUser() user: UserPayload,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(user, id, updateCategoryDto);
  }

  @Delete(':id')
  remove(@GetUser() user: UserPayload, @Param('id') id: string) {
    return this.categoriesService.remove(user, id);
  }
}

