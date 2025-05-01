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
