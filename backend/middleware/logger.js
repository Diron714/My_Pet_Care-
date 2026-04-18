import morgan from 'morgan';

// Request logging middleware
export const requestLogger = morgan('combined', {
  skip: (req, res) => {
    // Skip logging for health checks
    return req.url === '/health';
  }
});

export default requestLogger;

