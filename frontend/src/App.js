import React, { useState, useEffect } from 'react';
import { Route, Routes, Link, useNavigate } from 'react-router-dom';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import Login from './components/Login';
import Register from './components/Register';
import Posts from './components/Posts';
import PostDetail from './components/PostDetail';
import Profile from './components/Profile';
import ProtectedRoute from './components/protectedRoute';
// imports all routing components 

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // creates a state var to track is a user is logged in or not 
  // set as false as always fail securely 
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    // checks local storage for access token 
    if (token) {
      setIsLoggedIn(true);
      // this is to see if the user is logged in 
    }
  }, []);
  // empty array means this useEffect will only run once when
  // component is mounted 

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsLoggedIn(false);
    // when logged out remove token from local storage 
    navigate('/login');
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">My API SPA</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/posts">Posts</Nav.Link>
            {isLoggedIn && <Nav.Link as={Link} to="/profile">Profile</Nav.Link>}
          </Nav>
          <Nav>
            {isLoggedIn ? (
              <Button variant="outline-light" onClick={handleLogout}>Logout</Button>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </Container>
      </Navbar>
      <Container className="mt-4">
        <Routes>
          <Route path="/" element={<Posts />} />
          <Route path="/posts" element={<ProtectedRoute><Posts /></ProtectedRoute>} />
          <Route path="/posts/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </Container>
    </>
  );
}
// Nav.link links to the page 
export default App;
