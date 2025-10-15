import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcrypt';
import cors from 'cors';
import knex from 'knex';
import morgan from 'morgan';
import { redisClient } from './controllers/signin.js';

import { handleRegister } from './Controllers/register.js';
import { signinAuthentication } from './Controllers/signin.js';
import { handleProfileGet, handleProfileUpdate } from './Controllers/profile.js';
import { handleImage, handleApiCall } from './Controllers/image.js';
import { requireAuth } from './Controllers/authorization.js';

// ---------- DATABASE CONFIG ----------
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

// ---------- EXPRESS SETUP ----------
const app = express();
app.use(morgan('combined'));

// ---------- CORS CONFIGURATION ----------
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://face-recognition-frontend-deploy-adbs.onrender.com', // ✅ your deployed frontend
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn('❌ Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
    optionsSuccessStatus: 204,
};

// ✅ Must come BEFORE express.json() and routes
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use((req, res, next) => {
    console.log(`➡️  ${req.method} ${req.url}`, req.body);
    next();
});

// ---------- ROUTES ----------
app.get('/', (req, res) => res.json({ status: 'ok', message: 'Backend is running 🚀' }));

app.post('/signin', signinAuthentication(db, bcrypt));
app.post('/register', (req, res) => handleRegister(req, res, db, bcrypt));
app.get('/profile/:id', requireAuth, (req, res) => handleProfileGet(req, res, db));
app.post('/profile/:id', requireAuth, (req, res) => handleProfileUpdate(req, res, db));
app.put('/image', requireAuth, (req, res) => handleImage(req, res, db));
app.post('/imageurl', requireAuth, (req, res) => handleApiCall(req, res));

// ---------- SERVER ----------
const PORT = process.env.PORT || 3000;

redisClient.connect()
    .then(() => {
        console.log('✅ Redis connected');
        app.listen(PORT, () => {
            console.log(`✅ App running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Failed to connect to Redis:', err);
    });

