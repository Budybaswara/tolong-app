import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { AiService } from './ai.service';

class ChatDto {
  @IsString()
  @MinLength(2)
  message!: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private ai: AiService) {}

  @Post('chat')
  chat(@Body() body: ChatDto) {
    return this.ai.chat(body);
  }
}
