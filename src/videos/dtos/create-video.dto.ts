import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateVideoDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsString()
  @IsNotEmpty()
  s3Url: string;
}
