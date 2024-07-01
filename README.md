# node-express-rate-limiter

## Description

A middleware package for Express.js that helps manage API rate limiting with customizable rules, logging, and IP whitelisting.

## Features

- **Basic Rate Limiting**: Limit the number of requests a user can make within a specified time period.
- **Customizable Rate Limiting Rules**: Different limits for different routes or methods, user-specific rate limits.
- **IP Whitelisting**: Whitelist certain IP addresses that are exempt from rate limiting.
- **Logging**: Log rate limit events with customizable logging levels.
- **Rate Limit Exceeded Response**: Customizable response when the rate limit is exceeded.
- **Redis or In-Memory Store**: Support for storing rate limit data in Redis.
- **Flexible Identification**: Identify users by IP address, API key, user ID, or custom identifier.
- **Retry-After Header**: Include a `Retry-After` header in the response.
- **Burst Handling**: Allow a short burst of requests beyond the limit with a cooldown period.
- **Middleware Compatibility**: Compatible with other middleware.

## Installation

```bash
npm install node-express-rate-limiter

## Usage
```ts
import express from 'express';
import rateLimiter from 'node-express-rate-limiter';

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
```
## Configuration Options
- `windowMs`: The time window in milliseconds for rate limiting.
- `max`: The maximum number of requests allowed within the time window.
- `keyGenerator`: Function to generate a unique key for each user (default is req.ip).
- `onLimitReached`: Function to call when the rate limit is reached.
- `headers`: Whether to include rate limit headers in the response.
- `whitelist`: Array of IP addresses to whitelist.
- `store`: Configuration for the Redis store.
- `message`: Custom message to send when the rate limit is exceeded.

## License
[MIT]