import { Module } from '@nestjs/common';
import { ImagesModule } from './images/images.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ImagesModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '', 10) || 5432,
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'futuremind',
      autoLoadEntities: true,
      // fine for local dev - no need for migrations
      synchronize: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
