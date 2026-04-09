import { DataSource } from 'typeorm';
import { ImagesRepository } from './images.repository';
import { Image } from './image.entity';

describe('ImagesRepository', () => {
  let repository: ImagesRepository;

  beforeEach(() => {
    const mockDataSource = {
      createEntityManager: jest.fn(),
    } as unknown as DataSource;

    repository = new ImagesRepository(mockDataSource);
  });

  describe('findPaginated', () => {
    const mockImages: Image[] = [
      { id: 1, title: 'cat', url: '/uploads/cat.jpg', width: 100, height: 100 },
      { id: 2, title: 'dog', url: '/uploads/dog.jpg', width: 200, height: 200 },
    ];

    it('should return paginated results', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([mockImages, 2]);

      const result = await repository.findPaginated(1, 10);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: undefined,
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        data: mockImages,
        total: 2,
        page: 1,
        limit: 10,
      });
    });

    it('should calculate skip correctly for page 2', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[], 0]);

      await repository.findPaginated(2, 10);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });

    it('should filter by title with ILike when query is provided', async () => {
      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([[mockImages[0]], 1]);

      const result = await repository.findPaginated(1, 10, 'phrase');

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { title: expect.objectContaining({ _value: '%phrase%' }) },
        }),
      );
      expect(result.data).toHaveLength(1);
    });

    it('should not filter when query is undefined', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([mockImages, 2]);

      await repository.findPaginated(1, 10, undefined);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });

    it('should use defaults for page and limit', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[], 0]);

      await repository.findPaginated();

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: undefined,
        skip: 0,
        take: 20,
      });
    });
  });
});
