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
router.put('/user/posts/:id', requireScope('posts:write'), async (ctx) => {
  // protected route and only admin or owner can edit / delete 
  const { id } = ctx.params;
  const currentUser = ctx.state.user;
  const { content } = ctx.request.body;
  if (!content) {
    ctx.status = 400;
    ctx.body = { error: 'Content is required' };
    return;
  }
  try {
    const pool = await poolPromise;
    const post = await pool.query('SELECT * FROM posts WHERE id = ?', [id]);
    if (!post[0]) {
      ctx.status = 404;
      ctx.body = { error: 'Post not found' };
      return;
    }
    const postOwnerId = Number(post[0].user_id);
    const currentUserId = Number(currentUser.id);
    if (postOwnerId !== currentUserId && currentUser.role !== 'admin') {
      ctx.status = 403;
      ctx.body = { error: 'Not authorized to update this post' };
      return;
    }
    await pool.query('UPDATE posts SET content = ? WHERE id = ?', [content, id]);
    const updatedPost = await pool.query('SELECT * FROM posts WHERE id = ?', [id]);
    ctx.body = {
      message: 'Post updated',
      post: updatedPost[0],
      _links: {
        self: { href: `/posts/${id}` },
        delete: { href: `/user/posts/${id}`, method: 'DELETE' },
        like: { href: `/user/posts/${id}/like`, method: 'PUT' },
        comments: { href: `/user/posts/${id}/comments`, method: 'GET' }
      }
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

router.delete('/user/posts/:id', requireScope('posts:write'), async (ctx) => {
  const { id } = ctx.params;
  const currentUser = ctx.state.user;
  try {
    const pool = await poolPromise;
    const post = await pool.query('SELECT * FROM posts WHERE id = ?', [id]);
    if (!post[0]) {
      ctx.status = 404;
      ctx.body = { error: 'Post not found' };
      return;
    }
    const postOwnerId = Number(post[0].user_id);
    const currentUserId = Number(currentUser.id);
    if (postOwnerId !== currentUserId && currentUser.role !== 'admin') {
      ctx.status = 403;
      ctx.body = { error: 'Not authorized to delete this post' };
      return;
    }
    await pool.query('DELETE FROM posts WHERE id = ?', [id]);
    ctx.body = {
      message: 'Post deleted',
      _links: { all: { href: '/posts', method: 'GET' } }
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

router.get('/posts', async (ctx) => {
  // gets posts for a public feed 
  try {
    const pool = await poolPromise;
    let userId = ctx.state.user ? ctx.state.user.id : null;
    let query, params;
    // check if the user is authenticated 
    if (userId) {
      // if authenticated, so is logged in
      query = `
        SELECT posts.*, users.username, users.profilePic,
          (SELECT COUNT(*) FROM post_likes WHERE post_id = posts.id AND user_id = ?) AS likedCount
        FROM posts 
        INNER JOIN users ON posts.user_id = users.id 
        ORDER BY posts.created_at DESC
      `;
      // return if the user has liked each post 
      params = [userId];
      // if not authenticated it doesnt really matter 
    } else {
      query = `
        SELECT posts.*, users.username, users.profilePic, 0 AS likedCount
        FROM posts 
        INNER JOIN users ON posts.user_id = users.id 
        ORDER BY posts.created_at DESC
      `;
      // this is here so one day you dont need to login to be able to 
      // see posts, you just cant like or comment 
      params = [];
    }
    const posts = await pool.query(query, params);
    const postsWithLinks = posts.map(post => ({
      // map over each post to add hateoas links 
      ...post,
      liked: post.likedCount > 0,
      _links: {
        self: { href: `/posts/${post.id}` },
        update: { href: `/user/posts/${post.id}`, method: 'PUT' },
        delete: { href: `/user/posts/${post.id}`, method: 'DELETE' },
        comments: { href: `/user/posts/${post.id}/comments`, method: 'GET' },
        like: { href: `/user/posts/${post.id}/like`, method: 'PUT' }
      }
    }));
    ctx.body = {
      count: posts.length,
      posts: postsWithLinks
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

router.get('/posts/:id', async (ctx) => {
  // get single post 
  const { id } = ctx.params;
  try {
    const pool = await poolPromise;
    const results = await pool.query(
      `SELECT posts.*, users.username, posts.user_id
       FROM posts 
       INNER JOIN users ON posts.user_id = users.id 
       WHERE posts.id = ?`,
      [id]
    );
    if (!results[0]) {
      ctx.status = 404;
      ctx.body = { error: 'Post not found' };
      return;
    }
    const post = results[0];
    post._links = {
      self: { href: `/posts/${post.id}` },
      update: { href: `/user/posts/${post.id}`, method: 'PUT' },
      delete: { href: `/user/posts/${post.id}`, method: 'DELETE' },
      like: { href: `/user/posts/${post.id}/like`, method: 'PUT' },
      comments: { href: `/user/posts/${post.id}/comments`, method: 'GET' }
    };
    ctx.body = post;
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

router.put('/user/posts/:id/like', requireScope('posts:write'), async (ctx) => {
  // protected toggle like endpoint so only users can like 
  const { id } = ctx.params;
  const currentUser = ctx.state.user;
  if (!currentUser) {
    ctx.status = 401;
    ctx.body = { error: 'Authentication required' };
    return;
  }
  try {
    const pool = await poolPromise;
    const existingLike = await pool.query(
      'SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?',
      [id, currentUser.id]
    );
    if (existingLike.length > 0) {
      await pool.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [id, currentUser.id]);
      await pool.query('UPDATE posts SET likes = likes - 1 WHERE id = ? AND likes > 0', [id]);
      const updatedPost = await pool.query('SELECT * FROM posts WHERE id = ?', [id]);
      ctx.body = {
        message: 'Post unliked',
        post: updatedPost[0],
        liked: false,
        _links: {
          self: { href: `/posts/${id}` },
          like: { href: `/user/posts/${id}/like`, method: 'PUT' },
          all: { href: '/posts', method: 'GET' }
        }
      };
    } else {
      await pool.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [id, currentUser.id]);
      await pool.query('UPDATE posts SET likes = likes + 1 WHERE id = ?', [id]);
      const updatedPost = await pool.query('SELECT * FROM posts WHERE id = ?', [id]);
      ctx.body = {
        message: 'Post liked',
        post: updatedPost[0],
        liked: true,
        _links: {
          self: { href: `/posts/${id}` },
          like: { href: `/user/posts/${id}/like`, method: 'PUT' },
          all: { href: '/posts', method: 'GET' }
        }
      };
    }
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

module.exports = router;
