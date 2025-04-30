const request = require('supertest');
const { expect } = require('chai');
const app = require('../app');

describe('Social Media API Endpoints', function() {
  this.timeout(10000);
  let token;
  let refreshToken;
  let userId;
  let postId;
  let commentId;

  it('should register a new user', async function() {
    const res = await request(app.callback())
      .post('/register')
      .send({
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'password123'
      });
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('user');
    userId = res.body.user.id;
    // Test user registration
  });

  it('should fail registration with missing email', async function() {
    const res = await request(app.callback())
      .post('/register')
      .send({
        username: 'testuser2',
        password: 'password123'
      });
    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
    // test registration with missing email
  });

  it('should login the user', async function() {
    const res = await request(app.callback())
      .post('/login')
      .send({
        username: 'testuser',
        password: 'password123'
      });
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('token');
    token = res.body.token;
    refreshToken = res.body.refreshToken;
    // test user login
  });

  it('should return profile in XML format', async function() {
    const res = await request(app.callback())
      .get('/profile')
      .set('Cookie', [`access_token=${token}`])
      .set('Accept', 'application/xml');
    expect(res.status).to.equal(200);
    expect(res.headers['content-type']).to.include('application/xml');
    // test retrieving profile in XML format
  });

  it('should retrieve the user profile', async function() {
    const res = await request(app.callback())
      .get('/profile')
      .set('Cookie', [`access_token=${token}`]);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('username');
    // test retrieving profile in JSON format
  });

  it('should update the user profile', async function() {
    const res = await request(app.callback())
      .put('/profile')
      .set('Cookie', [`access_token=${token}`])
      .send({
        username: 'updateduser',
        profilePic: ''
      });
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('message', 'Profile updated');
    // test updating user profile
    // THIS IS TO BE ADDED, caused too many issues 
  });

  it('should create a new post', async function() {
    const res = await request(app.callback())
      .post('/user/posts')
      .set('Cookie', [`access_token=${token}`])
      .send({
        content: 'This is a test post'
      });
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('id');
    postId = res.body.id;
    // test creating a new post
  });

  it('should get public posts', async function() {
    const res = await request(app.callback())
      .get('/posts')
      .set('Cookie', [`access_token=${token}`]);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('posts');
    const found = res.body.posts.find(p => p.id === postId);
    expect(found).to.exist;
    expect(found.liked).to.be.false;
  });
  // test retrieving public posts

  it('should like the post', async function() {
    const res = await request(app.callback())
      .put(`/user/posts/${postId}/like`)
      .set('Cookie', [`access_token=${token}`]);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('liked', true);
    // test toggling like first like, then unlike
  });

  it('should unlike the post', async function() {
    const res = await request(app.callback())
      .put(`/user/posts/${postId}/like`)
      .set('Cookie', [`access_token=${token}`]);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('liked', false);
  });

  it('should add a comment to the post', async function() {
    const res = await request(app.callback())
      .post(`/user/posts/${postId}/comments`)
      .set('Cookie', [`access_token=${token}`])
      .send({
        content: 'This is a test comment'
      });
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('id');
    commentId = res.body.id;
    // test adding a comment to a post
  });

  it('should retrieve comments for the post', async function() {
    const res = await request(app.callback())
      .get(`/posts/${postId}/comments`)
      .set('Cookie', [`access_token=${token}`]);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('comments');
    expect(res.body.comments).to.be.an('array');
     // test retrieving comments for the post
  });

  it('should update the comment', async function() {
    const res = await request(app.callback())
      .put(`/user/posts/${postId}/comments/${commentId}`)
      .set('Cookie', [`access_token=${token}`])
      .send({
        content: 'Updated comment content'
      });
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('message', 'Comment updated');
    // test updating the comment
  });

  it('should delete the comment', async function() {
    const res = await request(app.callback())
      .delete(`/user/posts/${postId}/comments/${commentId}`)
      .set('Cookie', [`access_token=${token}`]);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('message', 'Comment deleted');
    // test deleting the comment
  });

  it('should delete the post', async function() {
    const res = await request(app.callback())
      .delete(`/user/posts/${postId}`)
      .set('Cookie', [`access_token=${token}`]);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('message', 'Post deleted');
    // test deleting the post
  });

  it('should create and update a post', async function() {
    const createRes = await request(app.callback())
      .post('/user/posts')
      .set('Cookie', [`access_token=${token}`])
      .send({ content: 'Post to be updated' });
    expect(createRes.status).to.equal(201);
    const updatePostId = createRes.body.id;

    const updatedContent = 'Post has been updated';
    const updateRes = await request(app.callback())
      .put(`/user/posts/${updatePostId}`)
      .set('Cookie', [`access_token=${token}`])
      .send({ content: updatedContent });
    expect(updateRes.status).to.equal(200);
    expect(updateRes.body).to.have.property('message', 'Post updated');
    expect(updateRes.body.post.content).to.equal(updatedContent);
    // test creating and then updating a post in one flow
  });
});
