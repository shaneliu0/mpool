import express from 'express';
import cors from 'cors';
import bp from 'body-parser';
import admin from 'firebase-admin';
// import sgMail from '@sendgrid/mail';
import { PrismaClient } from '@prisma/client';

admin.initializeApp({
    credential: admin.credential.cert(require('./serviceAccountKey.json')),
    databaseURL: "https://your-firebase-project-default-rtdb.firebaseio.com"
});

// sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

declare global {
    var prisma: PrismaClient;
}
const prisma = new PrismaClient();
global.prisma = prisma;

import poolRouter from './routes/pool/pool';
import chatRouter from './routes/chat';
import userRouter from './routes/user';
import notificationsRouter from './routes/notifications';
import staticRouter from './routes/static';
import safetyRouter from './routes/safety';

import './matching';

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
    const [_, token] = req.headers.authorization.split(' ');
    try {
        req.user = await admin
            .auth()
            .verifyIdToken(token);
        req.user.userId = null;
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
app.use('/static', staticRouter);
app.use('/safety', safetyRouter);

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log('Server started on port ' + port);
    if (Boolean(process.env.ALLOW_ALL)) {
        console.log("Allowing requests from all email endings.")
    }
});