import React, { useState } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

function Register(){
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  // state vars are declared to store input and messages 
  
  const handleSubmit = async (e) => {
    // handles reg when form is submitted 
    e.preventDefault();
    // clear all errors
    setSuccess('');
    setError('');
    try {
      await api.post('/register', {username, email, password});
      // sends post request to the /register endpoint with username, email and password
      setSuccess('Registration successful, redirecting to login');
      setTimeout(() => {
        navigate('/login');
      // on  registration, redirect to login page
      }, 2000);
    } catch (err){
      setError(err.response?.data?.error);
      // display error message
    }
  };
  return (
    <Card className="p-4">
     <h2>Register</h2>
     {error && <Alert variant="danger">{error}</Alert>}
     {success && <Alert variant="success">{success}</Alert>}
     <Form onSubmit={handleSubmit}>
     <Form.Group controlId="formUsername" className="mb-3">
     <Form.Label>Username</Form.Label>
      <Form.Control
      type="text"
      placeholder="Enter Username"
      value={username}
      onChange={(e) => setUsername(e.target.value)}
      required
      />
     </Form.Group>
     <Form.Group controlId="formEmail" className="mb-3">
     <Form.Label>Email</Form.Label>
      <Form.Control
      type="email"
      placeholder="Enter Eamil"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      required
      />
     </Form.Group>
     <Form.Group controlId="formPassword"className="mb-3">
     <Form.Label>Password</Form.Label>
     <Form.Control
      type="password"
      placeholder="Enter Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
      />
      </Form.Group>
      <Button variant="primary" type="submit">Register</Button>
      </Form>
      </Card>
      // handles form for user information
      // alerts displayed with success and error messages 
      // password input is hidden for security reasons 
  );
}

export default Register;
