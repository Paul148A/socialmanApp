import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class VideoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  tags: string;

  @Column()
  s3Url: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'published' | 'uploaded';

  @Column({ nullable: true })
  publishedOn: string;

  @CreateDateColumn()
  createdAt: Date;
}
