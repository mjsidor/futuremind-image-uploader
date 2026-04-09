import { Image } from './image.entity';

export class FindAllResponse {
  data: Image[];
  total: number;
  page: number;
  limit: number;
}
