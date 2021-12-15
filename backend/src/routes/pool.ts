import express from 'express';
import { Pool } from 'pg';

// @ts-ignore;
const pool: Pool = global.pool;

const router = express.Router();

router.get('/search', async (req, res) => {
    const { query } = req.query;

    
});

export default router;