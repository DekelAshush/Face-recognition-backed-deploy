import jwt from 'jsonwebtoken';
import { createClient } from 'redis';

const redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
        connectTimeout: 5000,
        tls: process.env.REDIS_URL?.startsWith('rediss://'),
    },
});
redisClient.on('error', (err) => console.error('Redis Error:', err));

const signToken = (username) =>
    jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '2d' });

const setToken = async (key, value) => {
    await redisClient.set(key, value);
};

const createSession = async (user) => {
    const { email, id } = user;
    const token = signToken(email);
    await setToken(token, id.toString());
    return { success: true, userId: id, token, user };
};

const handleSignin = (db, bcrypt, req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return Promise.reject('incorrect form submission');
    }
    const normalizedEmail = email.toLowerCase();
    return db
        .select('email', 'hash')
        .from('login')
        .whereRaw('LOWER(email) = ?', [normalizedEmail])
        .then((data) => {
            const isValid = bcrypt.compareSync(password, data[0].hash);
            if (isValid) {
                return db
                    .select('*')
                    .from('users')
                    .whereRaw('LOWER(email) = ?', [normalizedEmail])
                    .then((user) => user[0])
                    .catch(() => res.status(400).json('unable to get user'));
            } else {
                return Promise.reject('wrong credentials');
            }
        })
        .catch((err) => err);
};

const getAuthTokenId = async (req, res) => {
    const { authorization } = req.headers;
    try {
        const reply = await redisClient.get(authorization);
        if (!reply) return res.status(401).send('Unauthorized');
        return res.json({ id: reply });
    } catch (err) {
        return res.status(500).send('Error verifying token');
    }
};

const signinAuthentication = (db, bcrypt) => async (req, res) => {
    const { authorization } = req.headers;
    if (authorization) return getAuthTokenId(req, res);

    try {
        const data = await handleSignin(db, bcrypt, req, res);
        if (data.id && data.email) {
            const session = await createSession(data);
            return res.json(session);
        } else {
            throw new Error(data);
        }
    } catch (err) {
        return res.status(400).json(err.message || err);
    }
};

export { signinAuthentication, redisClient };
