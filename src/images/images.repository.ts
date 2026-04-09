import { Injectable } from '@nestjs/common';
import { DataSource, ILike, Repository } from 'typeorm';
import { Image } from './image.entity';

@Injectable()
export class ImagesRepository extends Repository<Image> {
  constructor(private readonly dataSource: DataSource) {
    super(Image, dataSource.createEntityManager());
  }

  async findPaginated(
    page: number = 1,
    limit: number = 20,
    query?: string,
  ): Promise<{ data: Image[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.findAndCount({
      where: query ? { title: ILike(`%${query}%`) } : undefined,
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }
}
