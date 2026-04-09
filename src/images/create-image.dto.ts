import { Type } from 'class-transformer';
import { IsInt, IsPositive, IsString } from 'class-validator';

export class CreateImageDto {
  @IsString()
  title: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  width: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  height: number;
}
