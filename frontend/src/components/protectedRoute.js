import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // takes children parameter, this represents the component 
  // that should be rendered if the user is authenticated 
  const isAuthenticated = localStorage.getItem('access_token'); 
  // check the user is authenticated by looking for this token in local storage 
  // if it exists, isAuthenticated will be true 
  // if not false 
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
