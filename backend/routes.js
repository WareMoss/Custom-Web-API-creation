const Router = require('@koa/router');
const { validateBody, userUpdateSchema } = require('./validate');
const authorise = require('./rbacauth');
const poolPromise = require('./config');

const router = new Router();

router.get('/users', async (ctx) => {
  try {
    const pool = await poolPromise;
    const users = await pool.query('SELECT * FROM users');
    const enhancedUsers = users.map(user => ({
      ...user,
      _links: {
        self: { href: `/users/${user.id}` },
        update: { href: `/users/${user.id}`, method: 'PUT' },
        delete: { href: `/users/${user.id}`, method: 'DELETE' }
      }
    }));
    // for each user
    // give hateoas links so that in future can delete user profile ( add in next update )
    ctx.body = {
      users: enhancedUsers,
      _links: { self: { href: '/users', method: 'GET' } }
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

router.post('/users', authorise(['admin']), async (ctx) => {
  // create new user which requires admin or to register 
  try {
    const { username, email } = ctx.request.body;
    if (!username || !email) {
      ctx.status = 400;
      ctx.body = { error: "Username and email are required" };
      return;
    }
    const pool = await poolPromise;
    const result = await pool.query('INSERT INTO users (username, email) VALUES(?, ?)', [username, email]);
    ctx.status = 201;
    ctx.body = {
      message: 'User Created',
      userId: result.insertId,
      _links: {
        self: { href: `/users/${result.insertId}` },
        all: { href: '/users', method: 'GET' }
      }
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

router.put('/users/:id', validateBody(userUpdateSchema), async (ctx) => {
  try {
    const { id } = ctx.params;
    const { username, email } = ctx.request.body;
    const pool = await poolPromise;
    const result = await pool.query('UPDATE users set username = ?, email = ? WHERE id = ?', [username, email, id]);
    if (result.affectedRows === 0) {
      ctx.status = 404;
      ctx.body = { error: 'User Not Found.' };
    } else {
      ctx.body = {
        message: 'User Updated.',
        _links: { self: { href: `/users/${id}` } }
      };
    }
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

router.delete('/users/:id', authorise(['admin']), async (ctx) => {
  try {
    const { id } = ctx.params;
    const pool = await poolPromise;
    const result = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      ctx.status = 404;
      ctx.body = { error: 'User not found.' };
    } else {
      ctx.body = {
        message: 'User Deleted.',
        _links: { self: { href: '/users', method: 'GET' } }
      };
    }
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

module.exports = router;
