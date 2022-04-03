import express from 'express';
import cors from 'cors';
import bp from 'body-parser';

import admin from 'firebase-admin';
import { Pool } from 'pg';

const pool = new Pool({
    user: "postgres",
    password: process.env.DB_PASSWORD,
    database: "your-firebase-project",
    host: "your-database-host",
    port: 5432,
    idleTimeoutMillis: 0
})

admin.initializeApp({
    credential: admin.credential.cert(require('./serviceAccountKey.json')),
    databaseURL: "https://your-firebase-project-default-rtdb.firebaseio.com"
});

// @ts-ignore
global.pool = pool;

import poolRouter from './routes/pool';
import chatRouter from './routes/chat';

const app = express();

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

app.get('/placesearch', async (req, res) => {
    
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log('Server started on port ' + port));