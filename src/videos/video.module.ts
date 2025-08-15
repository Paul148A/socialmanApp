import { Global, Module } from "@nestjs/common";
import { VideosService } from "./services/video.service";
import { VideosController } from "./controllers/video.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { VideoEntity } from "./entities/video.entity";

@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature([VideoEntity])
    ],
    controllers: [VideosController],
    providers: [VideosService],
    exports: [VideosService],
})

export class VideoModule {}