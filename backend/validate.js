const joi = require('joi');
// joi lib is used for validating javascript objects

const loginSchema = joi.object({

  username: joi.string().min(3).max(30).required(),
  password: joi.string().min(6).required()
  // define rules for login requests
});

const registerSchema = joi.object({
  username: joi.string().min(3).max(30).required(),
  email: joi.string().email().required(),
  password: joi.string().min(6).required()
  // define rules for registering 
});

const postSchema = joi.object({
  content: joi.string().min(1).required()
  // define post requirements
});

const commentSchema = joi.object({
  content: joi.string().min(1).required()
  // define comment requirements 
});

const userUpdateSchema = joi.object({
  username: joi.string().min(3).max(30).optional(),
  email: joi.string().email().optional()
  // define update user requirements
});

const profileUpdateSchema = joi.object({
  username: joi.string().min(3).max(30).optional(),
  profilePic: joi.string().uri().optional()
  // define profile requirements
});

function validateBody(schema) {
  return async (ctx, next) => {
    try {
      await schema.validateAsync(ctx.request.body);
      await next();
    } catch (err) {
      ctx.status = 400;
      ctx.body = { error: err.details[0].message };
    }
  };
}

module.exports = {
  loginSchema,
  registerSchema,
  postSchema,
  commentSchema,
  userUpdateSchema,
  profileUpdateSchema,
  validateBody
};
