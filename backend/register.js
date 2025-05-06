const Router = require('@koa/router');
const { validateBody, registerSchema } = require('./validate');
const bcrypt = require('bcryptjs');
const poolPromise = require('./config');

const router = new Router();

router.post('/register', validateBody(registerSchema), async (ctx) => {
    // decompose username, email and password from incoming request 
    const { username, email, password } = ctx.request.body;
    if (!username || !password || !email) {
        // check if any incoming field is missing 
        ctx.status = 400;
        ctx.body = { error: 'Username, email and password required' };
        return;
    }
    try {
        const saltRounds = 10;
        // salt rounds for bcrypt hashing 
        const hashedPass = await bcrypt.hash(password, saltRounds);
        // hash users password using bcrypt with salt rounds 
        const pool = await poolPromise;
        const result = await pool.query(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPass, 'user']
            // store in database 
            // default set to user 
        );
        const newUser = await pool.query(
            'SELECT id, username, email, created, role FROM users WHERE id = ?',
            [result.insertId]
        );
        ctx.status = 201;
        ctx.body = {
            message: 'User registered successfully',
            user: newUser[0],
            _links: {
                self: { href: `/users/${newUser[0].id}` },
                login: { href: '/login', method: 'POST' }
            }
            // respond with json success message, hateoas links as well as 
            // new user details 
        };
    } catch (err) {
        ctx.status = 500;
        ctx.body = { error: err.message };
    }
});

module.exports = router;
