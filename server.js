import 'dotenv/config';

import express from 'express';
import bcrypt from 'bcrypt';
import cors from 'cors';
import knex from 'knex';
import morgan from 'morgan';

import { handleRegister } from './Controllers/register.js';
import { signinAuthentication } from './Controllers/signin.js';
import { handleProfileGet, handleProfileUpdate } from './Controllers/profile.js';
import { handleImage, handleApiCall } from './Controllers/image.js';
import { requireAuth } from './Controllers/authorization.js';

// configure database connection: prefer DATABASE_URL (Render) with SSL, otherwise use individual DB_* vars
const connectionConfig = process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
} : {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

const db = knex({
    client: 'pg',
    connection: connectionConfig,
});

const app = express();

// CORS: allow origins from CORS_ALLOWED_ORIGINS (comma separated) or default local dev hosts
const defaultOrigins = ['http://localhost:5173', 'http://localhost:3000'];
let whitelist = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(s => s.trim())
    : defaultOrigins;

// If running in production on Render and no CORS_ALLOWED_ORIGINS provided, allow all origins
if (!process.env.CORS_ALLOWED_ORIGINS && process.env.NODE_ENV === 'production') {
    whitelist = ['*'];
}

const corsOptions = {
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (whitelist.indexOf('*') !== -1) return callback(null, true);
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};

app.use(morgan('combined'));
app.use(express.json());
app.use(cors(corsOptions));

// Health check
app.get('/', (req, res) => res.json({ status: 'ok' }));

app.post('/signin', signinAuthentication(db, bcrypt));
app.post('/register', (req, res) => handleRegister(req, res, db, bcrypt));

app.get('/profile/:id', requireAuth, (req, res) => handleProfileGet(req, res, db));
app.post('/profile/:id', requireAuth, (req, res) => handleProfileUpdate(req, res, db));

app.put('/image', requireAuth, (req, res) => handleImage(req, res, db));
app.post('/imageurl', requireAuth, (req, res) => handleApiCall(req, res));

// Start server: bind to Render-provided PORT when available
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`app is running on port ${PORT}`);
});
