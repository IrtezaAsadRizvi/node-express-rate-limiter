"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = __importDefault(require("./index"));
const app = (0, express_1.default)();
const limiter = (0, index_1.default)({
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
