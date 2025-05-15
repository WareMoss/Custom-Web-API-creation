import React, { useState } from 'react';
// import usestate hook 
import { Form, Button, Alert, Card } from 'react-bootstrap';
// import ui components 
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
//import useNavigate hook for navigation 

function Login({ setIsLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  // state variables for the login function 
  // useNavigate is used to redirect the user after a successful login attempt 

  const handleSubmit = async (e) => {
    // function to handle submission process 
    e.preventDefault();
    // prevent default form submmission behaviour as page would reload 
    setError('');
    try {
      const res = await api.post('/login', { username, password });
      // make post request to /login endpoint with username and password 
      // as request body 
      // Removed logging of sensitive data:
      // console.log('Logged in:', res.data);
      localStorage.setItem('access_token', res.data.token);
      // store the returned token in the browser's localStorage 
      // this is so it can be used for authentication requests 

      setIsLoggedIn(true);
      // update login state 

      navigate('/posts');
      // redirect user to /posts page using navigate function 
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      // if error occues update error state 
      // if no specific error output login failed 
    }
  };

  return (
    <Card className="p-4">
      <h2>Login</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formUsername" className="mb-3">
          <Form.Label>Username</Form.Label>
          <Form.Control
          /* form control is input field for username */
            type="text"
            placeholder="Enter Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group controlId="formPassword" className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Form.Group>
        <Button variant="primary" type="submit">
          Login
        </Button>
      </Form>
    </Card>
  );
}

export default Login;

