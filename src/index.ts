import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import Joi from 'joi';

interface RateLimiterOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  onLimitReached?: (req: Request, res: Response) => void;
  headers?: boolean;
  whitelist?: string[];
  store?: {
    host: string;
    port: number;
  };
  message?: string;
}

const defaultOptions: RateLimiterOptions = {
  windowMs: 60000,
  max: 100,
  headers: true,
  whitelist: [],
  message: 'Too many requests, please try again later.',
};

const rateLimiter = (options: RateLimiterOptions) => {
  const config = { ...defaultOptions, ...options };
  
  const validationSchema = Joi.object({
    windowMs: Joi.number().required(),
    max: Joi.number().required(),
    keyGenerator: Joi.func().optional(),
    onLimitReached: Joi.func().optional(),
    headers: Joi.boolean().optional(),
    whitelist: Joi.array().items(Joi.string().ip()).optional(),
    store: Joi.object({
      host: Joi.string().required(),
      port: Joi.number().required(),
    }).optional(),
    message: Joi.string().optional(),
  });
  
  const { error } = validationSchema.validate(config);
  if (error) {
    throw new Error(`RateLimiter configuration error: ${error.message}`);
  }

  const client = config.store ? new Redis(config.store) : new Redis();

  return async (req: Request, res: Response, next: NextFunction) => {
    const remoteAddress = req.ip || req.socket.remoteAddress || 'unknown';

    if (config.whitelist?.includes(remoteAddress)) {
      return next();
    }

    const key = config.keyGenerator ? config.keyGenerator(req) : remoteAddress;
    const current = await client.incr(key);

    if (current === 1) {
      await client.expire(key, config.windowMs / 1000);
    }

    if (current > config.max) {
      if (config.headers) {
        res.setHeader('X-RateLimit-Limit', config.max);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + config.windowMs).toISOString());
      }

      if (config.onLimitReached) {
        config.onLimitReached(req, res);
      }

      return res.status(429).send(config.message);
    }

    if (config.headers) {
      res.setHeader('X-RateLimit-Limit', config.max);
      res.setHeader('X-RateLimit-Remaining', config.max - current);
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + config.windowMs).toISOString());
    }

    next();
  };
};

export default rateLimiter;
