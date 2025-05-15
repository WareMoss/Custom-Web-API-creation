import React, { useState, useEffect } from 'react';
import { Card, Alert, Spinner, ListGroup } from 'react-bootstrap';
import api from '../services/api';

function Profile() {
  const [user, setUser] = useState(null);
  // stores current users profile data 
  const [userPosts, setUserPosts] = useState([]);
  // stores list of posts created by the user 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile?t=' + Date.now());
      // make a get request to the /profile endpoint with 
      // timnestamp to force a fresh response 
      console.log('Profile response:', res.data);
      // log for debug reasons 
      if (res.data && res.data.id) {
        // if the response contains user data and ID then update the user state 
        setUser(res.data);
      } else {
        setError('No user data returned.');
        // if no data is returned 
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.error || 'Error fetching profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async (userId) => {
    try {
      const res = await api.get('/posts?t=' + Date.now());
      // timestamp query peramater used 
      console.log('Posts response:', res.data);
      // 
      if (res.data.posts) {
        // if response contains an array, update it so that 
        // only includes poists that match the current users id 
        const posts = res.data.posts.filter(
          post => Number(post.user_id) === Number(userId)
        );
        setUserPosts(posts);
        // update userPosts state with the filtered posts 
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (user && user.id) {
      fetchUserPosts(user.id);
    }
  }, [user]);

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!user) return <Alert variant="info">No user data found.</Alert>;

  return (
    <div>
      <Card className="mb-3">
        <Card.Body>
          <Card.Title>Profile</Card.Title>
          <Card.Text>
            <strong>Username:</strong> {user.username} <br />
            <strong>Role:</strong> {user.role}
          </Card.Text>
        </Card.Body>
      </Card>
      <h3>Your Posts</h3>
      {userPosts.length > 0 ? (
        <ListGroup>
          {userPosts.map(post => (
            <ListGroup.Item key={post.id}>
              <div>
                <strong>Post ID:</strong> {post.id} <br />
                <strong>Content:</strong> {post.content}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      ) : (
        <Alert variant="info">You have no posts.</Alert>
      )}
    </div>
  );
}

// code keeps breaking when commented so:
// renders users profile inside a Card
// displays users posts
// if there are user posts, display them in ListGroup
// for each post render ListGroup.item displaying the id of the post and content 
// if no posts, dislay alert 

export default Profile;

