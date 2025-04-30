const Router = require('@koa/router');
const poolPromise = require('./config');
const { validateBody, commentSchema } = require('./validate');
const router = new Router();

router.post('/user/posts/:postId/comments', validateBody(commentSchema), async (ctx) => {
  // post route so the user can create a new comment
  const { id: userId } = ctx.state.user || {};
  // if user not set, defeault to nothing, error handling
  const { postId } = ctx.params;
  const { content } = ctx.request.body;
  // extracts userID from decoded token 
  try {
    const pool = await poolPromise;
    // try and connect to database
    const post = await pool.query('SELECT * FROM posts WHERE id = ?', [postId]);
    // parameterised querys to prevent SQL Injection 
    if (!post[0]) {
      // if no post is found,
      ctx.status = 404;
      ctx.body = { error: 'Post not found' };
      // error handling for if post isnt present 
      return;
    }
    const result = await pool.query(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [postId, userId, content]
      // insert new comment into comments table and associating it with the post and the user 
    );
    const commentId = result.insertId;
    // get new comment ID
    ctx.status = 201;
    // response 201 as comment has been created and returned a JSON object
    ctx.body = {
      id: commentId, 
      // id of new comment
      post_id: postId,
      // id  of the post the comment was made about 
      user_id: userId,
      // user id 
      content,
      // content of comment 
      _links: {
        self: { href: `/user/posts/${postId}/comments/${commentId}` },
        update: { href: `/user/posts/${postId}/comments/${commentId}`, method: 'PUT' },
        delete: { href: `/user/posts/${postId}/comments/${commentId}`, method: 'DELETE' },
        all: { href: `/posts/${postId}/comments`, method: 'GET' }
        // hateoas links for furhter actions 
      }
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: err.message };
    // if error occurs, send this 
  }
});

router.get('/posts/:postId/comments', async (ctx) => {
  // gets all comments from a post
  const { postId } = ctx.params;
  // extract post ID
  try {
    const pool = await poolPromise;
    const comments = await pool.query(
      `SELECT comments.*, users.username, users.profilePic 
       FROM comments 
       INNER JOIN users ON comments.user_id = users.id 
       WHERE comments.post_id = ? 
       ORDER BY comments.created_at DESC`,
      [postId]
      // big SQL command to:
      // get comments for a post, along with the users table to get user info too 
      // order the comments by newest to oldest 
    );
    const commentsWithLinks = comments.map(comment => ({
      // map through comments to add HATEOAS links for each 
      ...comment,
      _links: {
        self: { href: `/posts/${postId}/comments/${comment.id}` },
        update: { href: `/user/posts/${postId}/comments/${comment.id}`, method: 'PUT' },
        delete: { href: `/user/posts/${postId}/comments/${comment.id}`, method: 'DELETE' }
      }
    }));
    ctx.body = {
      count: comments.length,
      comments: commentsWithLinks,
      _links: { self: { href: `/posts/${postId}/comments`, method: 'GET' } }
      // return a json reponse with, total number of comments, array of comments and hateoas links 
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

router.put('/user/posts/:postId/comments/:id', validateBody(commentSchema), async (ctx) => {
  // this route is protected by validate middleware as it ensures that only a admin or the owner can do this 
  // ensures it adheres to comment schema in validate middleware 
  const { postId, id } = ctx.params;
  const { content } = ctx.request.body;
  const { id: userId, role } = ctx.state.user;
  // get the postid, content and user role and id and stuff from the request and store it 
  // in ctx.state.user
  try {
    const pool = await poolPromise;
    const comment = await pool.query('SELECT * FROM comments WHERE id = ? AND post_id = ?', [id, postId]);
    if (!comment[0]) {
      // returns all comments in array and if empty no comments
      ctx.status = 404;
      ctx.body = { error: 'Comment not found' };
      return;
    }
    console.log(`Update Comment Debug: Comment owner: ${comment[0].user_id}, Current user: ${userId}, Role: ${role}`);
    // to log what comment was changed by who 
    
    if (Number(comment[0].user_id) !== Number(userId) && role !== 'admin') {
      // check if owner or admin to update comment 
      ctx.status = 403;
      ctx.body = { error: 'Not authorised to update comment' };
      return;
      // ensures only admin or owner can update 
    }
    await pool.query('UPDATE comments SET content = ? WHERE id = ?', [content, id]);
    ctx.body = {
      message: 'Comment updated',
      _links: {
        self: { href: `/user/posts/${postId}/comments/${id}` },
        all: { href: `/posts/${postId}/comments`, method: 'GET' }
      }
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

router.delete('/user/posts/:postId/comments/:id', async (ctx) => {
  const { postId, id } = ctx.params;
  const { id: userId, role } = ctx.state.user;
  // same stuff as ealier so to save myself, see prev comments to explain this 
  try {
    const pool = await poolPromise;
    const comment = await pool.query('SELECT * FROM comments WHERE id = ? AND post_id = ?', [id, postId]);
    if (!comment[0]) {
      ctx.status = 404;
      ctx.body = { error: 'Comment not found' };
      return;
    }
    console.log(`Delete Comment Debug: Comment owner: ${comment[0].user_id}, Current user: ${userId}, Role: ${role}`);
    

    if (Number(comment[0].user_id) !== Number(userId) && role !== 'admin') {
      ctx.status = 403;
      ctx.body = { error: 'Not authorised to delete comment' };
      return;
    }
    await pool.query('DELETE FROM comments WHERE id = ?', [id]);
    ctx.body = {
      message: 'Comment deleted',
      _links: { self: { href: `/posts/${postId}/comments`, method: 'GET' } }
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

module.exports = router;
