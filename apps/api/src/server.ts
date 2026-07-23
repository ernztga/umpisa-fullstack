import { createApp } from '@/app';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { prisma } from '@/lib/prisma';

/**
 * Process entrypoint. Boots the Express+Apollo app and starts listening.
 * Also wires graceful shutdown so in-flight requests and the Prisma
 * connection pool are closed cleanly on SIGTERM/SIGINT
 */
async function main(): Promise<void> {
  const app = await createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 API server ready at http://localhost:${env.PORT}/graphql`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Shutdown complete.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((error) => {
  logger.error({ err: error }, 'Fatal error during startup');
  process.exit(1);
});
