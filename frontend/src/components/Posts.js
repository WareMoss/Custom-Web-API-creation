import React, { useState, useEffect } from 'react';
// useState for managing state variables 
// useEffect for running code on update 
import { Card, Button, Spinner, Alert, Form } from 'react-bootstrap';
import api from '../services/api';
// import the api to make HTTP requests 
import { Link } from 'react-router-dom';

function Posts() {
  const [posts, setPosts] = useState([]);
  // stores an array of posts retrieved from the API 
  const [loading, setLoading] = useState(true);
  // indicates if the post is currently being fetched 
  const [error, setError] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [editingPostId, setEditingPostId] = useState(null);
  // tracks id of the post currently being edited 
  const [editContent, setEditContent] = useState('');
  // // holds text input for creating a new post 
  const [currentUser, setCurrentUser] = useState(null);
  // stores current users profile fetched from the api 

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/profile');
      // backend should attach a token to this automatically 
      setCurrentUser(res.data);
      // update current user state with data from api 
    } catch (err) {
      console.error('Error fetching current user:', err);
      setCurrentUser(null);
    }
  };

  // Fetch posts
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/posts');
      setPosts(Array.isArray(res.data.posts) ? res.data.posts : []);
      // if the response contains a posts array, update the posts state 
    } catch (err) {
      setError(err.response?.data?.error || 'Error fetching posts');
      // error handling 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // useEffect runs when the component mounts to fetch current user 
    // and posts 
    fetchCurrentUser();
    fetchPosts();
  }, []);
  // empty dependency array means this runs only once per mount 

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) {
      // ensure the posts is not whitespace or empty 
      setError('Post content is required.');
      return;
    }
    try {
      await api.post('/user/posts', { content: newPostContent });
      // send a post request with the content of the post 
      setNewPostContent('');
      fetchPosts(); 
      // Refresh the list
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating post');
    }
  };

  const handleEditClick = (post) => {
    setEditingPostId(post.id);
    // sets setEditingPostId to current users post id and fills 
    setEditContent(post.content);
    // editContent with the posts original content 
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditContent('');
    // cancel editing
  };

  const handleSaveEdit = async (postId) => {
    try {
      await api.put(`/user/posts/${postId}`, { content: editContent });
      // send a put request with the new contetn for the post 
      fetchPosts(); 
      // refresh posts
      setEditingPostId(null);
      setEditContent('');
      // clear all editing states 
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating post');
    }
  };

  const handleDelete = async (postId) => {
    try {
      await api.delete(`/user/posts/${postId}`);
      fetchPosts(); 
    } catch (err) {
      setError(err.response?.data?.error || 'Error deleting post');
    }
  };

  const handleLike = async (post) => {
    try {
      const likeUrl = post._links?.like?.href || `/user/posts/${post.id}/like`;
      // find url for toggling like
      // use hateoas link 
      const res = await api.put(likeUrl);
      // put request to toggle the like status 
      setPosts(prevPosts =>
        prevPosts.map(p =>
        // update the post state by mapping htrough the post and updating the one that was
        // like or unliked 
          p.id === post.id
            ? { ...p, likes: res.data.post.likes, liked: res.data.liked }
            : p
        )
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Error toggling like');
    }
  };

  if (loading) return <Spinner animation="border" />;
  // display spinny wheel if loading 
  if (error) return <Alert variant="danger">{error}</Alert>;
  // display alert if error 

  return (
    <>
      {currentUser && (
        <Card className="mb-3">
          <Card.Body>
            <Form onSubmit={handleCreatePost}>
              <Form.Group controlId="newPostContent">
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="What's on your mind?"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  required
                />
              </Form.Group>
              <Button variant="success" type="submit" className="mt-2">
                Create Post
              </Button>
            </Form>
          </Card.Body>
        </Card>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <Button variant="primary" onClick={fetchPosts}>
          Refresh Posts
        </Button>
      </div>

      <h2>Posts</h2>
      {posts.length > 0 ? (
        posts.map((post) => {
          const isAuthorized =
            currentUser &&
            (Number(post.user_id) === Number(currentUser.id) || currentUser.role === 'admin');
            // Only allow editing/deleting if user is the post owner or admin

          return (
            <Card key={post.id} className="mb-3">
              <Card.Body>
                <Card.Title>{post.username}</Card.Title>
                {editingPostId === post.id ? (
                  <>
                    <Form.Control
                      as="textarea"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                    <div className="mt-2">
                      <Button variant="primary" size="sm" onClick={() => handleSaveEdit(post.id)}>
                        Save
                      </Button>
                      <Button variant="secondary" size="sm" onClick={handleCancelEdit} className="ms-2">
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Card.Text>{post.content}</Card.Text>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <Button
                        variant="primary"
                        as={Link}
                        to={post._links?.self?.href || `/posts/${post.id}`}
                      >
                        View Details
                      </Button>
                      <Button
                        variant={post.liked ? "success" : "outline-success"}
                        onClick={() => handleLike(post)}
                      >
                        {post.liked ? "Unlike" : "Like"} ({post.likes})
                      </Button>
                      {isAuthorized && (
                        <>
                          <Button variant="warning" size="sm" onClick={() => handleEditClick(post)}>
                            Edit
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDelete(post.id)}>
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          );
        })
      ) : (
        <Alert variant="info">No posts found.</Alert>
      )}
    </>
  );
}

// scared to comment code above as it keeps breaking so:
// renders form to create new post if the user is logged in 
// and then refresh button fetches posts 

export default Posts;

