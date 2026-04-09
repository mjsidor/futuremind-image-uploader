jest.mock('typeorm', () => ({
  Entity: () => jest.fn(),
  PrimaryGeneratedColumn: () => jest.fn(),
  Column: () => jest.fn(),
  Repository: class {},
  DataSource: class {},
  ILike: jest.fn((val: string) => ({ _type: 'ilike', _value: val })),
}));

jest.mock('sharp');

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
  },
}));

import { ImagesService } from './images.service';
import { ImagesRepository } from './images.repository';
import { Image } from './image.entity';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import { FindAllResponse } from './find-all.response';

const mockedSharp = jest.mocked(sharp);

const sharpInstance = {
  resize: jest.fn().mockReturnThis(),
  toFile: jest.fn(),
};

describe('ImagesService (unit)', () => {
  let service: ImagesService;
  let repository: jest.Mocked<ImagesRepository>;

  beforeEach(() => {
    mockedSharp.mockReturnValue(sharpInstance as unknown as sharp.Sharp);
    repository = {
      save: jest.fn(),
      findOneBy: jest.fn(),
      findPaginated: jest.fn(),
    } as unknown as jest.Mocked<ImagesRepository>;

    service = new ImagesService(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should resize image, save file, and persist entity', async () => {
      jest.spyOn(global.crypto, 'randomUUID').mockReturnValue('uuid-123');

      const file: Express.Multer.File = {
        originalname: 'test.png',
        buffer: Buffer.from('fake-image'),
      } as unknown as Express.Multer.File;

      const result = await service.create(file, 'Test', 800, 600);

      expect(fs.mkdir).toHaveBeenCalled();

      expect(mockedSharp).toHaveBeenCalledWith(file.buffer);

      expect(sharpInstance.resize).toHaveBeenCalledWith(800, 600, {
        fit: 'contain',
      });

      expect(sharpInstance.toFile).toHaveBeenCalledWith(
        expect.stringContaining('uuid-123.png'),
      );

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test',
          width: 800,
          height: 600,
          url: expect.stringContaining('/uploads/uuid-123.png'),
        }),
      );

      expect(result).toEqual(
        expect.objectContaining({
          title: 'Test',
          width: 800,
          height: 600,
          url: expect.stringContaining('/uploads/uuid-123.png'),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should call repository', async () => {
      const image = { id: 1 } as Image;
      repository.findOneBy.mockResolvedValue(image);

      const result = await service.findOne(1);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toBe(image);
    });
  });

  describe('findAll', () => {
    it('should call repository with pagination', async () => {
      const response = {
        data: [],
        total: 0,
        page: 2,
        limit: 5,
      } as FindAllResponse;
      repository.findPaginated.mockResolvedValue(response);

      const result = await service.findAll(2, 5, 'abc');

      expect(repository.findPaginated).toHaveBeenCalledWith(2, 5, 'abc');
      expect(result).toBe(response);
    });
  });
});
