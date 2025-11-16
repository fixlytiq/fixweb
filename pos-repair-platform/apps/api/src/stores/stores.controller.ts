import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { UserPayload } from '../auth/types';

@Controller('stores')
@UseGuards(JwtAuthGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  // Note: Store creation happens during registration (POST /auth/register)
  // This endpoint is disabled as each registration creates one store
  // @Post()
  // create(@GetUser() user: UserPayload, @Body() createStoreDto: CreateStoreDto) {
  //   return this.storesService.create(user, createStoreDto);
  // }

  @Get()
  async findAll(@GetUser() user: UserPayload) {
    try {
      return await this.storesService.findAll(user);
    } catch (error: any) {
      console.error('Error in stores controller findAll:', error);
      throw error;
    }
  }

  @Get(':id')
  findOne(@GetUser() user: UserPayload, @Param('id') id: string) {
    return this.storesService.findOne(user, id);
  }

  @Patch(':id')
  update(
    @GetUser() user: UserPayload,
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateStoreDto,
  ) {
    return this.storesService.update(user, id, updateStoreDto);
  }

  @Delete(':id')
  async remove(@GetUser() user: UserPayload, @Param('id') id: string) {
    try {
      return await this.storesService.remove(user, id);
    } catch (error: any) {
      console.error('Error in stores controller remove:', error);
      throw error;
    }
  }
}

