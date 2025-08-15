import { Controller, Get, Post, Body, Query, UseInterceptors, UploadedFile, Param } from '@nestjs/common';
import { CreateVideoDto } from '../dtos/create-video.dto';
import { VideosService } from '../services/video.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) { }

  @Post()
  create(@Body() dto: CreateVideoDto) {
    return this.videosService.create(dto);
  }

  @Get()
  findAll() {
    return this.videosService.findAll();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    return this.videosService.uploadVideo(file);
  }

  @Get('published')
  async findPublishedVideos() {
    return this.videosService.getPublishedVideos();
  }

  @Get('uploaded')
  getUploadedVideos() {
    return this.videosService.getUploadedVideos();
  }

  @Post('publish/facebook')
  async publishToFacebook(
    @Body() body: { url: string }
  ) {
    return this.videosService.uploadVideoToFacebook(body.url);
  }
}
