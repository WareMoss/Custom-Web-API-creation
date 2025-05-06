module.exports = function authorise(allowedRoles = []){
    // defines the allowed roles to access a resource
    // if no roles are specified no restrictions so public 
    return async (ctx, next) => {
        const user = ctx.state.user;
        if(!user || (allowedRoles.length > 0 && !allowedRoles.includes(user.role))){
            ctx.status = 403;
            ctx.body = {error: 'forbidden: not authorised'};
            return;
            // checks if there are no authenticated user OR if there are allowed roles defined
            // and the users role is not in the list  
        }
        await next();
        // if authorised, pass
    };
};
