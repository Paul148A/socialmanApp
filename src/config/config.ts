import { registerAs } from '@nestjs/config';

export const config = registerAs('config', () => {
  return {
    database: {
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USER,
    },
  };
});