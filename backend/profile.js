const Router = require('@koa/router');
const poolPromise = require('./config');
const { validateBody, profileUpdateSchema } = require('./validate');
const router = new Router();

router.get('/profile', async (ctx) => {
  //console.log("Request headers:", ctx.request.headers);
  //console.log("Decoded token (ctx.state.user):", ctx.state.user);
  // commented out to prevent sensitive info being exposed 
  
  if (!ctx.state.user || !ctx.state.user.id) {
    ctx.status = 401;
    ctx.body = { error: 'Not authenticated' };
    return;
  }
  const userId = ctx.state.user.id;
  // get userid from JWT contents in ctx.state.user
  try {
    const pool = await poolPromise;
    const users = await pool.query(
      'SELECT id, username, email, profilePic, role FROM users WHERE id = ?',
      [userId]
    );
    if (!users[0]) {
      ctx.status = 404;
      ctx.body = { error: 'User not found' };
      return;
    }
    ctx.body = {
      ...users[0],
      _links: {
        self: { href: '/profile' },
        update: { href: '/profile', method: 'PUT' }
      }
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

router.put('/profile', async (ctx) => {
  if (!ctx.state.user || !ctx.state.user.id) {
    ctx.status = 401;
    ctx.body = { error: 'Not authenticated' };
    return;
  }
  
  const userId = ctx.state.user.id;
  const { username, profilePic } = ctx.request.body;
  try {
    const pool = await poolPromise;
    await pool.query('UPDATE users SET username = ?, profilePic = ? WHERE id = ?', [username, profilePic, userId]);
    const updatedUser = await pool.query(
      'SELECT id, username, email, profilePic, role FROM users WHERE id = ?',
      [userId]
    );
    ctx.body = {
      message: 'Profile updated',
      user: updatedUser[0],
      _links: {
        self: { href: '/profile' }
      }
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

module.exports = router;
