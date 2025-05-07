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
