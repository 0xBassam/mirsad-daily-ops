import { env } from './config/env';
import { connectDB } from './config/db';
import app from './app';

async function main() {
  await connectDB();
  const port = parseInt(env.PORT, 10);
  app.listen(port, () => {
    console.log(`Mirsad server running on port ${port} [${env.NODE_ENV}]`);
  });
}

main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
