import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
// imports dependancies 

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
// create react root container for API
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
// this renders the react application into the DOM 
// React.StrictMode is used to activate checks and warning for dependancies
// BrowserRouter wraps the app component to enable routing functionality
