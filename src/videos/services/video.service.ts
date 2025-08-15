import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { VideoEntity } from '../entities/video.entity';
import { CreateVideoDto } from '../dtos/create-video.dto';
import { PutObjectCommand, S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import axios from 'axios';

@Injectable()
export class VideosService {
  constructor(
    @InjectRepository(VideoEntity)
    private readonly videoRepository: Repository<VideoEntity>,
  ) { }

  async create(dto: CreateVideoDto) {
    const video = this.videoRepository.create(dto);
    return await this.videoRepository.save(video);
  }

  async findAll(search?: string, orderBy?: 'title' | 'createdAt') {
    return await this.videoRepository.find({
      where: search
        ? [{ title: Like(`%${search}%`) }, { tags: Like(`%${search}%`) }]
        : {},
      order: { [orderBy || 'createdAt']: 'DESC' },
    });
  }

  private s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  async uploadVideo(file: Express.Multer.File) {
    const fileKey = `${Date.now()}-${file.originalname}`;

    // Subir a S3
    await this.s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    // Guardar metadata en la base de datos
    const video = this.videoRepository.create({
      title: file.originalname,
      s3Url: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`,
      status: 'uploaded',
      createdAt: new Date(),
    });

    await this.videoRepository.save(video);

    return video;
  }

  async getUploadedVideos(): Promise<VideoEntity[]> {
    const videos = await this.videoRepository.find({
      where: { status: 'uploaded' },
      order: { createdAt: 'DESC' },
    });

    const videosWithUrls = await Promise.all(
      videos.map(async (video) => {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: video.s3Url.split('/').pop(),
        });

        const signedUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
        return {
          ...video,
          s3Url: signedUrl,
        };
      })
    );

    return videosWithUrls;
  }

  async getPublishedVideos(): Promise<VideoEntity[]> {
    const videos = await this.videoRepository.find({
      where: { status: 'published' },
      order: { createdAt: 'DESC' }
    })

    const videosWithUrls = await Promise.all(
      videos.map(async (videos) => {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: videos.s3Url.split('/').pop()
        });
        const signedUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
        return {
          ...videos,
          s3Url: signedUrl,
        };
      })
    )
    return videosWithUrls;
  }

  async uploadVideoToFacebook(url: string) {
    const fileName: string = new URL(url).pathname.split("/").pop();
    const cleanFileName: string = fileName.replace(/^\d+-/, "");
    const video = await this.videoRepository.findOne({ where: { title: cleanFileName } });
    if (!video) throw new NotFoundException('Video no encontrado');

    const endpoint = `https://graph.facebook.com/v23.0/${process.env.FB_PAGE_ID}/videos`;

    try {
      const response = await axios.post(endpoint, null, {
        params: {
          file_url: url,
          title: 'video subido con api graph',
          description: 'Video publicado',
          access_token: process.env.FB_PAGE_ACCESS_TOKEN,
        },
      });

      video.status = 'published';
      await this.videoRepository.save(video);

      return {
        message: 'Video subido correctamente a Facebook',
        facebookVideoId: response.data.id,
      };
    } catch (error: any) {
      throw new Error(
        `Error subiendo video a Facebook: ${JSON.stringify(error.response?.data || error.message)}`
      );
    }
  }
}



