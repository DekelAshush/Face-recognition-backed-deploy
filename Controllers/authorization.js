import { redisClient } from './signin.js';

export async function requireAuth(req, res, next) {
    console.log('requireAuth headers:', req.headers.authorization);
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).send('Unauthorized');
    }

    try {
        // Redis v4+ uses Promises, not callbacks
        const reply = await redisClient.get(authorization);

        if (!reply) {
            return res.status(401).send('Unauthorized');
        }

        // Token exists → continue to next middleware
        return next();
    } catch (err) {
        console.error('Redis error in requireAuth:', err);
        return res.status(500).json('Internal Server Error');
    }
}
