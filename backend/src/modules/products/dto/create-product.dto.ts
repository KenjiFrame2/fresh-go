import { IsNotEmpty, IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreateProductDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsNumber() @Min(0.01)
  price: number;

  @IsString() @IsOptional()
  description?: string;

  @IsNumber() @IsOptional()
  @Min(0)
  oldPrice?: number;

  @IsString() @IsOptional()
  imageUrl?: string;

  @IsString() @IsOptional()
  categoryId?: string;
}