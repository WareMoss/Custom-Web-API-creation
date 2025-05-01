// NOTE TO SELF:
// not every line is commented as if I have explained it before
// typing it again will take a while 


const Router = require('@koa/router');
const { validateBody, postSchema } = require('./validate');
const poolPromise = require('./config');
const requireScope = require('./scopeAuth');
const router = new Router();

router.post('/user/posts', requireScope('posts:write'), validateBody(postSchema), async (ctx) => {
  // create a new post
  // protected so must have an account to make 
  // validated by validate middleware which checks the request adheres to rules made in validate
  const { id: userId } = ctx.state.user || {};
  // gets userid from decoded JWT token 
  // if undefined, make empty 
  if (!userId) {
    ctx.status = 401;
    ctx.body = { error: 'Authentication required' };
    return;
  }
  const { content } = ctx.request.body;
  if (!content) {
    ctx.status = 400;
    ctx.body = { error: 'Content is required' };
    return;
    // error handling
  }
  try {
    const pool = await poolPromise;
    // connect to db or try to 
    const result = await pool.query(
      'INSERT INTO posts (user_id, content) VALUES (?, ?)',
      [userId, content]
    );
    const postId = result.insertId;
    ctx.status = 201;
    ctx.body = {
      id: postId,
      user_id: userId,
      content,
      likes: 0,
      _links: {
        self: { href: `/posts/${postId}` },
        update: { href: `/user/posts/${postId}`, method: 'PUT' },
        delete: { href: `/user/posts/${postId}`, method: 'DELETE' },
        like: { href: `/user/posts/${postId}/like`, method: 'PUT' },
        comments: { href: `/user/posts/${postId}/comments`, method: 'GET' }
        // this part respond with a JSON object that includes:
        // new post details 
        // id, user_id, content and inital like count which is 0
        // hateoas links for self, update etc 
      }
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});
