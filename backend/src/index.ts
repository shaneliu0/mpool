import express from 'express';
import cors from 'cors';
import bp from 'body-parser';

import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: 5432,
    idleTimeoutMillis: 0
})

admin.initializeApp({
    credential: admin.credential.cert(require('./serviceAccountKey.json')),
    databaseURL: "https://your-firebase-project-default-rtdb.firebaseio.com"
});


declare global {
    var prisma: PrismaClient;
}
const prisma = new PrismaClient();
global.prisma = prisma;

import poolRouter from './routes/pool/pool';
import chatRouter from './routes/chat';
import userRouter from './routes/user';
import notificationsRouter from './routes/notifications';

const app = express();

const waitForThreeSeconds = () => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 3000);
    });
  };

async function decodeUserToken(req: any, res: any, next: any) {
    if (!req.headers.authorization) return next();
    try {
        req.user = await admin
            .auth()
            .verifyIdToken(req.headers.authorization);
        next();
    } catch (e) {
        return res.status(403).json({ error: "Error Authenticating!" })
    }
}

app.use(decodeUserToken);
app.use(cors());
app.use(bp.json());

app.use('/pool', poolRouter);
app.use('/chat', chatRouter);
app.use('/user', userRouter);
app.use('/notifications', notificationsRouter);

app.get('/placesearch', async (req, res) => {
    
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log('Server started on port ' + port));