require('dotenv').config();
// used for environment variables, so sensitive info isnt stored in plaintext in code
const Koa = require('koa');
const logger = require('koa-logger');
// for logging http requests and responses to console
const bodyParser = require('koa-bodyparser');
// middleware import for incoming requests
const etag = require('koa-etag');
// caching stuff
const conditional = require('koa-conditional-get');
// supports conditional get (duh)
const js2xmlParser = require('js2xmlparser');
// converts JS into XML
const yaml = require('js-yaml');
// converts JS to YAML
const koaJwt = require('koa-jwt');
// JSON web tokens for authentication in koa
const cors = require('@koa/cors');
// this enables cross origin resource sharing
const http = require('http');
// built in module to create HTTP server

const authroutes = require('./auth');
const router = require('./routes');
const register = require('./register');
const posts = require('./posts');
const comments = require('./comments');
const profile = require('./profile');
const seclogger = require('./log');
const { validateBody, profileUpdateSchema } = require('./validate');
// these are all imports for different API endpoints I have created 

const app = new Koa();
// create new Koa instance

app.use(async (ctx, next) => {
  try {
    await next();
    // try processing request by calling next in line middleware part
  } catch (err) {
    ctx.status = err.status || 500;
    // if error, call error code or 500 if there is none
    ctx.body = {
      error: err.message,
      _links: {
        home: { href: '/', method: 'GET' },
        login: { href: '/login', method: 'POST' },
      // make sure error message includes HATEOAS links such as home (/) and login (/login)
      }
    };
    seclogger.error(`Error: ${err.message} at ${ctx.request.url}`);
    // log error details
  }
});

app.use(logger());
app.use(bodyParser());
app.use(conditional());
app.use(etag());

// middleware for logging, caching, and to parse incoming requests to a JS object
app.use(cors({
  // official cors middleware 
  credentials: true,
  // allow cookies and other creds to be sent with requests from approves origins 
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  // specify which HTTP methods are allowed 
  allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cache-Control']}));
  // specify which headers can be sent by clients for cross origin requests

app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  // set allowed HTTP methods for CORS
  ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Cache-Control');
  // set allowed headers for CORS
  if (ctx.method === 'OPTIONS') {
    ctx.status = 204;
    // used for preflight checks 
    return;
  }
  await next();
});

app.use(authroutes.routes()).use(authroutes.allowedMethods());
// mount authentication routes before protecting with JWT
app.use(koaJwt({ secret: process.env.JWT_SECRET }).unless({ 
  // JWT to protect all routes except register or login 
  path: [/^\/login/, /^\/register/] 
  // regex to excluse these two routes
}));

app.use(async (ctx, next) => {
  await next();
  // if no response exit 
  if (!ctx.body) return;
  const accepts = ctx.accepts(['json', 'xml', 'yaml', 'text']);
  // determine what content type is accepted
  if (accepts === 'xml') {
    ctx.type = 'application/xml';
    ctx.body = js2xmlParser.parse("response", ctx.body);
  } else if (accepts === 'yaml') {
    ctx.type = 'application/x-yaml';
    ctx.body = yaml.dump(ctx.body);
  } else if (accepts === 'text') {
    ctx.type = 'text/plain';
    ctx.body = JSON.stringify(ctx.body, null, 2);
  } else {
    ctx.type = 'application/json';
  }
  // this converts the content to the clients prefered one 
  // increases flexibility of the API
});

app.use(register.routes()).use(register.allowedMethods());
app.use(router.routes()).use(router.allowedMethods());
app.use(posts.routes()).use(posts.allowedMethods());
app.use(comments.routes()).use(comments.allowedMethods());
app.use(profile.routes()).use(profile.allowedMethods());
// mount other routes

app.use(async (ctx) => {
  ctx.body = {
    message: 'Welcome, this is the API',
    _links: {
      self: { href: '/', method: 'GET' },
      login: { href: '/login', method: 'POST' },
      register: { href: '/register', method: 'POST' }
      // fallback for if any requests dont match existing routes
    }
  };
});

const port = process.env.PORT;
http.createServer(app.callback()).listen(port, () => {
  console.log(`Server running`);
  // this was used for debugging
});

module.exports = app;
