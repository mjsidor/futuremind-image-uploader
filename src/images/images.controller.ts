import {
  Body,
  Controller,
  DefaultValuePipe,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { CreateImageDto } from './create-image.dto';
import { Image } from './image.entity';
import { ImagesService } from './images.service';
import { FindAllResponse } from './find-all.response';
import { memoryStorage } from 'multer';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPE_REGEX = /image\/(jpg|jpeg|png|webp)/;

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'title', 'width', 'height'],
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string' },
        width: { type: 'integer' },
        height: { type: 'integer' },
      },
    },
  })
  async create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({ fileType: ALLOWED_FILE_TYPE_REGEX, fallbackToMimetype: true }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: CreateImageDto,
  ): Promise<Image> {
    return await this.imagesService.create(
      file,
      dto.title,
      dto.width,
      dto.height,
    );
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'title', required: false, type: String })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('title') title?: string,
  ): Promise<FindAllResponse> {
    return await this.imagesService.findAll(page, limit, title);
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Image> {
    const result = await this.imagesService.findOne(id);
    if (!result) {
      throw new NotFoundException();
    }

    return result;
  }
}
