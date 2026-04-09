import { Injectable } from '@nestjs/common';
import { Image } from './image.entity';
import { ImagesRepository } from './images.repository';
import { FindAllResponse } from './find-all.response';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class ImagesService {
  constructor(private readonly imagesRepository: ImagesRepository) {}

  async create(
    file: Express.Multer.File,
    title: string,
    width: number,
    height: number,
  ): Promise<Image> {
    const ext = path.extname(file.originalname) || '.jpg';
    const fileName = `${crypto.randomUUID()}${ext}`;
    const outputPath = path.join(__dirname, '../..', 'uploads', fileName);

    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    await sharp(file.buffer)
      .resize(width, height, { fit: 'contain' })
      .toFile(outputPath);

    const image = new Image();
    image.height = height;
    image.width = width;
    image.title = title;
    image.url = outputPath;

    await this.imagesRepository.save(image);

    return image;
  }

  async findOne(id: number): Promise<Image | null> {
    return await this.imagesRepository.findOneBy({ id });
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    query?: string,
  ): Promise<FindAllResponse> {
    return await this.imagesRepository.findPaginated(page, limit, query);
  }
}
