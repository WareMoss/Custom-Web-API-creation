import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Alert, Form, Modal } from 'react-bootstrap';
import api from '../services/api';
// import  API helper to make HTTP requests to backend 
import Comments from './Comments';
// import Comments components 

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  // extract id from route, using useParams
  // create navigate function 

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [editPostModal, setEditPostModal] = useState(false);
  const [editedPostContent, setEditedPostContent] = useState('');
  const [commentRefresh, setCommentRefresh] = useState(0);
  // define state variables for managing post details, loading status, 
  // error messages, current users profile and modal handling for editing posts 

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/profile', { params: { t: Date.now() } });
      // get request to the /profile endpoint with a timestamp 
      console.log('Fetched current user:', res.data);
      setCurrentUser(res.data);
      // update current user state with retrieved data 
      localStorage.setItem('currentUser', JSON.stringify(res.data));
      // store current user data in local storage 
    } catch (err) {
      console.error('Error fetching current user:', err);
      // catch error 
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('Using fallback currentUser from localStorage:', parsed);
        // if error use this as fall back 
        setCurrentUser(parsed);
      } else {
        setCurrentUser(null);
        //otherwise no current user 
      }
    }
  };

  const fetchPost = useCallback(async () => {
    // function to fetch posts, use memoizes so it only refreshes
    // when id changes 
    setLoading(true);
    // set loading before making a request 
    try {
      const res = await api.get(`/posts/${id}`, { headers: { 'Cache-Control': 'no-cache' } });
      // make a get request to the /posts/$id endpoint 
      // passing header to prevent caching for a up to date response 
      console.log('Fetched post:', res.data);
      setPost(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error fetching post');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCurrentUser();
    fetchPost();
  }, [fetchPost]);

  const handleEditPost = async () => {
    try {
      const res = await api.put(`/user/posts/${id}`, { content: editedPostContent });
      console.log('Post updated:', res.data);
      // put request to update the post at /user/posts/id 
      // logging 
      setPost(res.data.post || res.data);
      setEditPostModal(false);
      // api may return updated data under post or as an entire response 
      // close edit post modal 
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating post');
    }
  };

  const handleDeletePost = async () => {
    try {
      await api.delete(`/user/posts/${id}`);
      navigate('/posts');
    } catch (err) {
      setError(err.response?.data?.error || 'Error deleting post');
    }
  };

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!post) return <Alert variant="info">No post found.</Alert>;

  console.log('Post:', post);
  console.log('Current User:', currentUser);
  // determine if current user is authorised to edit or delete post 

  const isAuthorized =
    currentUser &&
    (Number(post.user_id) === Number(currentUser.id) || currentUser.role === 'admin');
      // a user is authorised is they are the owner or admin 

  return (
    <>
      <Card className="mb-3">
        <Card.Body>
          <Card.Title>{post.username || 'Unknown User'}</Card.Title>
          <Card.Text>{post.content}</Card.Text>
          {/* display content of post */}
          <div>
            <Button variant="primary" onClick={fetchPost}>Refresh</Button>
            {/* on click refreshes post details*/}
            {isAuthorized && (
              /* if current user is authorised display this */
              <>
                <Button
                  variant="warning"
                  onClick={() => {
                    setEditedPostContent(post.content);
                    setEditPostModal(true);
                  }}
                  className="ms-2"
                >
                  Edit Post
                </Button>
                <Button variant="danger" onClick={handleDeletePost} className="ms-2">
                  Delete Post
                </Button>
              </>
            )}
          </div>
        </Card.Body>
      </Card>

      <Card className="mb-3 p-3">
        <h3>Add a Comment</h3>
        <Form
          onSubmit={async (e) => {
            e.preventDefault();
            // Retrieve the comment value directly from the form element
            const comment = e.target.elements.comment.value;
            console.log('Submitting comment:', comment);
            if (typeof comment !== 'string' || comment.trim() === '') {
              console.error('Comment is not a valid string');
              setError('Comment should be a non-empty string.');
              return;
              /* form for adding a new comment */
            }
            try {
              const res = await api.post(`/user/posts/${id}/comments`, { content: comment });
              console.log('Comment submitted:', res.data);
              e.target.reset();
              setCommentRefresh(prev => prev + 1);
              // increment comment refresh state to re trigger rendering 
            } catch (err) {
              console.error('Error submitting comment:', err);
              setError(err.response?.data?.error || 'Error adding comment');
            }
          }}
        >
          <Form.Group controlId="comment">
            <Form.Control
              as="textarea"
              name="comment"
              rows={3}
              placeholder="Enter Comment"
              required
            />
          </Form.Group>
          <Button variant="primary" type="submit" className="mt-2">
            Submit Comment
          </Button>
        </Form>
      </Card>

      <Comments key={commentRefresh} postId={id} />
      {/* render comment components and force a refresh when comment refresh changes by using it as a key */}

      <Modal show={editPostModal} onHide={() => setEditPostModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Post</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="editPostContent">
            <Form.Control
              as="textarea"
              rows={3}
              value={editedPostContent}
              onChange={(e) => setEditedPostContent(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditPostModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditPost}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default PostDetail;

