import React, { useEffect, useState, useCallback } from 'react';
import { Card, Button, Alert, Spinner } from 'react-bootstrap';
import api from '../services/api';
// import react and hooks from react library 
// useEffect = run code when component mounts or updates 
// useState = manage data inside component 
// useCallback = remember functions so they arent created ever time its rendered 
function Comments({ postId }) {
  // defines functional react component called comments 
  // takes postId 
  const [comments, setComments] = useState([]);
  // define var using useState hooks 
  const [loading, setLoading] = useState(true);
  // loading indicates if comments are being fetched 
  const [error, setError] = useState('');
  // error holds error messages 

  const fetchComments = useCallback(async () => {
    // define function to fetch comments using callback hook so that is 
    // only applied when postId changes 
    setLoading(true);
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      // get request to API to get comments for that specific post 
      if (res.data && res.data.comments) {
        // check if repsonse contains data object with comments array 
        setComments(res.data.comments);
        // update comments state with the array from response 
      } else {
        setComments([]);
        // if no, set no comments 
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error fetching comments');
      // catch error and update error state with message 
    } finally {
      setLoading(false);
      // loading false as comments fetched 
    }
  }, [postId]);
  // will only change function when postId changes 

  useEffect(() => {
    // this is a hook, runs after component mounts and whenver dependancies change 
    // in this case postId
    if (postId) {
      fetchComments();
      //if valid postId provided, call fetch comments to load comments 
    } else {
      setError('No valid post ID provided.');
      // no valid post, error 
      setLoading(false);
    }
  }, [postId, fetchComments]);
  // re run when these change 

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/user/posts/${postId}/comments/${commentId}`);
      fetchComments();
      // make a delete request to API endpoint for specific commentId 
      // after delete, refresh by calling fetch comments again 
    } catch (err) {
      setError(err.response?.data?.error || 'Error deleting comment');
    }
  };

  const handleEdit = async (comment) => {
    // handle editing comments using a single prompt 
    // takes entire comment as a param 
    const newContent = window.prompt("Enter new comment content:", comment.content);
    // display prompt to let user enter new comment 
    if (newContent === null || newContent.trim() === "") {
      return; 
      // user cancelled or entered an empty string
    }
    try {
      await api.put(`/user/posts/${postId}/comments/${comment.id}`, { content: newContent });
      // make a put request to update the comment with new content 
      fetchComments();
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating comment');
    }
  };

  if (loading) return <Spinner animation="border" />;
  // render spinny wheel 
  if (error) return <Alert variant="danger">{error}</Alert>;
  // if error, alert with error message
  if (!comments || comments.length === 0) return <Alert variant="info">No Comments</Alert>;
  // if no comments say that 

  return (
    <>
      <h3>Comments</h3>
      {comments.map((comment) => (
        /* map over each comment in commetns arrray and render them */
        <Card key={comment.id} className="mb-2">
          <Card.Body>
            {comment.profilePic && (
              /* if comment has a profile picture try and render */
              <img
                src={comment.profilePic}
                alt="Profile"
                style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px' }}
              />
            )}
            <Card.Title>{comment.username}</Card.Title>
            <Card.Text>{comment.content}</Card.Text>
            {/* try and render authors user name and content */}
            <div>
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="me-2"
                onClick={() => handleEdit(comment)}
              >
                Edit
              </Button>
              <Button 
                variant="outline-danger" 
                size="sm"
                onClick={() => handleDelete(comment.id)}
              >
                Delete
              </Button>
            </div>
          </Card.Body>
        </Card>
      ))}
    </>
  );
}

export default Comments;
// export 
