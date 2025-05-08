import React, { useEffect, useState, useCallback } from 'react';
import { Card, Button, Alert, Spinner } from 'react-bootstrap';
import api from '../services/api';
// import react and hooks from react library 
// useEffect = run code when component mounts or updates 
// useState = manage data inside component 
// useCallback = remember functions so they arent created ever time its rendered 
