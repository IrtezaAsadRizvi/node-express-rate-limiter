"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const joi_1 = __importDefault(require("joi"));
const defaultOptions = {
    windowMs: 60000,
    max: 100,
    headers: true,
    whitelist: [],
    message: 'Too many requests, please try again later.',
};
const rateLimiter = (options) => {
    const config = Object.assign(Object.assign({}, defaultOptions), options);
    const validationSchema = joi_1.default.object({
        windowMs: joi_1.default.number().required(),
        max: joi_1.default.number().required(),
        keyGenerator: joi_1.default.func().optional(),
        onLimitReached: joi_1.default.func().optional(),
        headers: joi_1.default.boolean().optional(),
        whitelist: joi_1.default.array().items(joi_1.default.string().ip()).optional(),
        store: joi_1.default.object({
            host: joi_1.default.string().required(),
            port: joi_1.default.number().required(),
        }).optional(),
        message: joi_1.default.string().optional(),
    });
    const { error } = validationSchema.validate(config);
    if (error) {
        throw new Error(`RateLimiter configuration error: ${error.message}`);
    }
    const client = config.store ? new ioredis_1.default(config.store) : new ioredis_1.default();
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const remoteAddress = req.ip || req.socket.remoteAddress || 'unknown';
        if ((_a = config.whitelist) === null || _a === void 0 ? void 0 : _a.includes(remoteAddress)) {
            return next();
        }
        const key = config.keyGenerator ? config.keyGenerator(req) : remoteAddress;
        const current = yield client.incr(key);
        if (current === 1) {
            yield client.expire(key, config.windowMs / 1000);
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
    });
};
exports.default = rateLimiter;
