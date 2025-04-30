const jwt = require('jsonwebtoken');
// load env variables
const bcrypt = require('bcryptjs');
// import bcryptjs to hash and compare passwords securely 
const Router = require('@koa/router');
// import to define api routes
const { validateBody, loginSchema } = require('./validate');
// import validation middleware for login requests
const poolPromise = require('./config');
// import database connection information
const router = new Router();
// create new router instance
const seclogger = require('./log');
// import logging file

const defaultScopes = [
  'posts:read',
  'posts:write',
  'comments:read',
  'comments:write',
  'profile:read',
  'profile:write'
];
// this is the default scopes to be included in the JWT token for all users

router.post('/login', validateBody(loginSchema), async (ctx) => {
  // creates a post /login route for user auth
  const { username, password } = ctx.request.body;
  // extract username and password from the request body 
  if (!username || !password) {
    // if either is missing
    ctx.status = 400;
    // return 400
    ctx.body = { error: 'Username and password are required' };
    // this is an instance of error handling
    return;
  }
  try {
    const pool = await poolPromise;
    // try and connect to MySQL pool
    const users = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
    // parameterised queries to prevent SQL Injection 
    // queries database for matching username
    if (users.length === 0) {
      ctx.status = 401;
      // if no user is found return 401
      ctx.body = { error: 'Invalid username or password' };
      seclogger.info(`Login failed for non-existing user "${username}" from IP ${ctx.ip}`);
      // invalid creds, log ip and attempted username 
      return;
    }
    const user = users[0];
    // gets first and only user from results
    const match = await bcrypt.compare(password, user.password);
    // compare provided password to the hashed password
    if (!match) {
      ctx.status = 401;
      // if no match, 401
      ctx.body = { error: 'Invalid username or password' };
      seclogger.info(`Login failed for user "${username}" from IP ${ctx.ip}`);
      // login failed, state the username in logs and ip
      return;
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      scopes: defaultScopes
    };
    // this is the token payload with the user details and default scopes

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    // sign a JWT token with the payload using the secret and set an expiration time 

    const refreshToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    // do the same but have a longer one 
    
    ctx.cookies.set('access_token', token, {
      httpOnly: true,
      secure: false,  
      // changed for HTTP
      // in production, will change to true to make it only use HTTPS 
      sameSite: 'Strict',
      maxAge: 15 * 60 * 1000
      // time in miliseconds
    });
    // set the refresh token in a HTTP-only cookie

    ctx.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: false,  
      // changed for HTTP
      // in production, will change to true to make it only use HTTPS 
      sameSite: 'Strict',
      maxAge: 1 * 24 * 60 * 60 * 1000
    });

    ctx.body = {
      message: 'Login Successful',
      // if login successful,
      token,
      // access token for API authentication 
      refreshToken,
      //creates a new refresh token to get a new token later
      _links: {
        self: { href: '/login' },
        logout: { href: '/logout', method: 'POST' }
      }
    };
    seclogger.info(`Login successful for user "${username}" from IP ${ctx.ip}`);
    // log login info and IP
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: err.message };
    // error handling 
  }
});

router.post('/refresh-token', async (ctx) => {
  // post /refresh-token
  const refreshToken = ctx.cookies.get('refresh_token');
  // get token from cookies
  if (!refreshToken) {
    // if none are present
    ctx.status = 401;
    ctx.body = { error: 'Refresh token missing' };
    // error handling
    return;
  }
  try {
    const decode = jwt.verify(refreshToken, process.env.JWT_SECRET);
    // verify the JWT is signed with the secret thing in .env
    const tokenPayload = {
      id: decode.id,
      username: decode.username,
      role: decode.role,
      scopes: decode.scopes || defaultScopes
      // create a new token using decoded old token data, if fails, use default scopes
    };
    const newAccessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    ctx.cookies.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: false,
        // changed for HTTP
      // in production, will change to true to make it only use HTTPS 
      sameSite: 'Strict',
      maxAge: 15 * 60 * 1000
    });
    ctx.body = {
      message: 'Token refreshed',
      token: newAccessToken,
      _links: { self: { href: '/refresh_token' } }
      // respond with new token and hateaos links
    };
  } catch (err) {
    ctx.status = 401;
    ctx.body = { error: 'Invalid token' };
    // error handling for invalid token
  }
});

router.get('/me', async (ctx) => {
  if (!ctx.state.user) {
    // checks if the user info is set in ctx.state 
    ctx.status = 401;
    ctx.body = { error: 'Not Authorised' };
    // error handling if they dont have authorisation 
    return;
  }
  const { id, username, role } = ctx.state.user;
  // extract user properties from JWT
  ctx.body = { id, username, role };
  // respond with user details 
});

router.post('/logout', async (ctx) => {
  // define a post route to clear auth cookies upon logout
  ctx.cookies.set('access_token', null);
  ctx.cookies.set('refresh_token', null);
  // clears cookies
  ctx.body = { message: 'Logged out successfully' };
});

module.exports = router;
// export so it can be used in app.js
