import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ImagesModule } from '../src/images/images.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Image } from '../src/images/image.entity';
import { DataSource } from 'typeorm';
import { promises as fs } from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const SEED_IMAGES = [
  { title: 'Sunset', width: 200, height: 150, url: '/uploads/sunset.png' },
  { title: 'Mountain', width: 400, height: 300, url: '/uploads/mountain.png' },
  { title: 'Ocean view', width: 300, height: 200, url: '/uploads/ocean.png' },
];

describe('Images (e2e)', () => {
  let app: INestApplication;
  let seededImages: Image[];

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DATABASE_HOST || 'localhost',
          port: parseInt(process.env.DATABASE_PORT || '', 10) || 5433,
          username: process.env.DATABASE_USER || 'postgres',
          password: process.env.DATABASE_PASSWORD || 'postgres',
          database: process.env.DATABASE_NAME || 'futuremind_test',
          entities: [Image],
          synchronize: true,
          dropSchema: true,
        }),
        ImagesModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  beforeEach(async () => {
    const repo = app.get(DataSource).getRepository(Image);
    await repo.clear();
    await fs.rm(UPLOADS_DIR, { recursive: true, force: true });

    seededImages = await repo.save(SEED_IMAGES.map((s) => repo.create(s)));
  });

  afterAll(async () => {
    await fs.rm(UPLOADS_DIR, { recursive: true, force: true });
    await app.close();
  });

  const createTestImage = async (
    width = 300,
    height = 300,
  ): Promise<Buffer> => {
    return sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();
  };

  describe('POST /images', () => {
    it('should create an image', async () => {
      const imageBuffer = await createTestImage();

      const response = await request(app.getHttpServer())
        .post('/images')
        .field('title', 'test image')
        .field('width', '100')
        .field('height', '100')
        .attach('file', imageBuffer, 'test.png')
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        title: 'test image',
        width: 100,
        height: 100,
        url: expect.stringContaining('.png'),
      });

      const filePath = response.body.url as string;
      const stat = await fs.stat(filePath);
      expect(stat.isFile()).toBe(true);
      expect(stat.size).toBeGreaterThan(0);
    });

    it('should reject request without a file', async () => {
      await request(app.getHttpServer())
        .post('/images')
        .field('title', 'no file')
        .field('width', '100')
        .field('height', '100')
        .expect(400);
    });

    it('should reject non-image files', async () => {
      await request(app.getHttpServer())
        .post('/images')
        .field('title', 'text')
        .field('width', '100')
        .field('height', '100')
        .attach('file', Buffer.from('not an image'), 'test.txt')
        .expect(400);
    });

    it('should reject request with missing title', async () => {
      const imageBuffer = await createTestImage();

      await request(app.getHttpServer())
        .post('/images')
        .field('width', '100')
        .field('height', '100')
        .attach('file', imageBuffer, 'test.png')
        .expect(400);
    });

    it('should reject files that are too large', async () => {
      await request(app.getHttpServer())
        .post('/images')
        .field('title', 'big')
        .field('width', '100')
        .field('height', '100')
        .attach('file', Buffer.alloc(6 * 1024 * 1024), 'big.png')
        .expect(400);
    });
  });

  describe('GET /images', () => {
    it('should return seeded images', async () => {
      const response = await request(app.getHttpServer())
        .get('/images')
        .expect(200);

      expect(response.body).toMatchObject({
        data: SEED_IMAGES,
        total: 3,
        page: 1,
        limit: 10,
      });
    });

    it('should properly paginate', async () => {
      let response = await request(app.getHttpServer())
        .get('/images?page=1&limit=2')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.limit).toBe(2);
      expect(response.body.total).toBe(3);

      response = await request(app.getHttpServer())
        .get('/images?page=2&limit=2')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.limit).toBe(2);
      expect(response.body.total).toBe(3);

      response = await request(app.getHttpServer())
        .get('/images?page=3&limit=2')
        .expect(200);

      expect(response.body.data).toHaveLength(0);
      expect(response.body.limit).toBe(2);
      expect(response.body.total).toBe(3);
    });

    it('should return data matching the filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/images?title=Sunset')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Sunset');
    });


    it('should return no data matching the filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/images?title=nonexistent')
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /images/:id', () => {
    it('should return a seeded image by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/images/${seededImages[0].id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: seededImages[0].id,
        title: 'Sunset',
        width: 200,
        height: 150,
      });
    });

    it('should return 404 for non-existent image', async () => {
      await request(app.getHttpServer()).get('/images/99999').expect(404);
    });
  });
});
