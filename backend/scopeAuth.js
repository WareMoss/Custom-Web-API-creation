// scopeAuth.js
module.exports = function requireScope(requiredScope) {
  return async (ctx, next) => {
    // asynchronously return middleware function that koa will call 
    // during request lifecycle 
    const user = ctx.state.user;
    if (!user || !user.scopes || !user.scopes.includes(requiredScope)) {
        // checks if user doesnt existm OR is user does not have scopes property 
      ctx.status = 403;
      ctx.body = { error: 'Forbidden: insufficient scope' };
      return;
    }
    await next();
  };
};
