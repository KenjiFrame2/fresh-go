import { Controller, Get, UseGuards, Req, Patch, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Получить список всех магазинов
  // Доступно любому авторизованному пользователю
  @Get('stores')
  @UseGuards(JwtAuthGuard)
  async getStores() {
    return this.usersService.findStores();
  }

  // Получить информацию о текущем пользователе (для профиля)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: any) {
    const userId = req.user.id;
    return this.usersService.findById(userId);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getPending() {
    return this.usersService.findPendingUsers();
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  approve(@Param('id') id: string) {
    return this.usersService.approveUser(id);
  }

  @Get('stores/:id')
  @UseGuards(JwtAuthGuard)
  getStoreInfo(@Param('id') id: string) {
    return this.usersService.findStoreInfo(id);
  }
}
