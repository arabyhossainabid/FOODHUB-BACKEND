import app from './app';
import config from './config/env';
import swaggerDocs from './config/swagger';

// For local development
if (require.main === module) {
  const main = async () => {
    try {
      app.listen(config.port, () => {
        console.log(`Server running on port ${config.port}`);
        swaggerDocs(app as any, config.port);
      });
    } catch (error) {
      console.error(error);
    }
  };
  main();
}

// For Vercel serverless functions
export default app;
