import { Injectable } from '@nestjs/common';
import { DataSource, ILike, Repository } from 'typeorm';
import { Image } from './image.entity';
import { FindAllResponse } from './find-all.response';

@Injectable()
export class ImagesRepository extends Repository<Image> {
  constructor(private readonly dataSource: DataSource) {
    super(Image, dataSource.createEntityManager());
  }

  async findPaginated(
    page: number = 1,
    limit: number = 20,
    query?: string,
  ): Promise<FindAllResponse> {
    const [data, total] = await this.findAndCount({
      where: query ? { title: ILike(`%${query}%`) } : undefined,
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }
}
