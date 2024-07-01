import express from 'express';
import rateLimiter from './index';

const app = express();

const limiter = rateLimiter({
  windowMs: 60000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  store: {
    host: 'localhost',
    port: 6379
  },
  onLimitReached: (req, res) => {
    console.warn(`Rate limit reached for IP: ${req.ip}`);
  }
});

app.use(limiter);

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
