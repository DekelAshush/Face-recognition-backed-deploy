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

// Configure database connection (Render uses DATABASE_URL)
const connectionConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    }
    : {
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smartbrain',
    };

const db = knex({
    client: 'pg',
    connection: connectionConfig,
});

const app = express();

//  Logging, JSON parsing, and CORS setup
app.use(morgan('combined'));
app.use(express.json());

//  Allow localhost + deployed frontend
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://face-recognition-frontend-deploy-adbs.onrender.com', // ← your deployed frontend
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
    })
);
app.options('*', cors()); // Handles preflight requests (OPTIONS)

//  Health check endpoint (useful for Render)
app.get('/', (req, res) => res.json({ status: 'ok', message: 'Backend is running 🚀' }));

//  Routes
app.post('/signin', signinAuthentication(db, bcrypt));
app.post('/register', (req, res) => handleRegister(req, res, db, bcrypt));

app.get('/profile/:id', requireAuth, (req, res) => handleProfileGet(req, res, db));
app.post('/profile/:id', requireAuth, (req, res) => handleProfileUpdate(req, res, db));

app.put('/image', requireAuth, (req, res) => handleImage(req, res, db));
app.post('/imageurl', requireAuth, (req, res) => handleApiCall(req, res));

// Start server (Render provides PORT automatically)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(` App running on port ${PORT}`);
});
