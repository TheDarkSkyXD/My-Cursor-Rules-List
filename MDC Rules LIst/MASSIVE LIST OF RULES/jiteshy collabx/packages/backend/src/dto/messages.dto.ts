import {
  IsString,
  IsNumber,
  ValidateNested,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SelectionDto {
  @IsNumber()
  @Min(0)
  start: number;

  @IsNumber()
  @Min(0)
  end: number;
}

export class BaseMessageDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export class JoinMessageDto extends BaseMessageDto {
  @IsString()
  @IsNotEmpty()
  username: string;
}

export class LeaveMessageDto extends BaseMessageDto {
  @IsNumber()
  @Min(1)
  userId: number;
}

export class ContentChangeMessageDto extends BaseMessageDto {
  @IsString()
  content: string;
}

export class CursorMoveMessageDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsNumber()
  position: number;

  @IsNotEmpty()
  @IsString()
  sessionId: string;
}

export class SelectionChangeMessageDto extends BaseMessageDto {
  @ValidateNested()
  @Type(() => SelectionDto)
  selection: SelectionDto;

  @IsNumber()
  @Min(1)
  userId: number;
}

export class LanguageChangeMessageDto extends BaseMessageDto {
  @IsString()
  @IsNotEmpty()
  language: string;
}

export class ErrorMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  type: string;
}
