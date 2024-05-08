import express, { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import fs from 'fs';
import path from 'path';
import jwt, { JwtPayload } from 'jsonwebtoken';
import 'dotenv/config'; 

const app = express();
const LOG_FILE_PATH = path.join(__dirname, 'audit-log.txt');

app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  const { method, url } = req;
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - Method: ${method}, URL: ${url}\n`;
  console.log(logEntry);
  fs.appendFileSync(LOG_FILE_PATH, logEntry, { encoding: 'utf8' });
  next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    req.user = decoded as JwtPayload; 
    next();
  });
});

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`Authenticated User ID: ${req.user?.id}`);
  next();
});

app.use('/api', createProxyMiddleware({
  target: 'http://example.com', 
  changeOrigin: true,
  pathRewrite: { '^/api': '' }, 
}));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Gateway Microservice listening on port ${PORT}!`);
});
