import { Button } from 'bootstrap';
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import About from '../src/feacher/about/about';
// import Contact from '../src/feacher/contact/contact';
import Home from '../src/feacher/homepage/homepage';
import Main from '../src/feacher/main/index';

function App() {

  return (
    <div className="app">

    <Router >
        <Routes>

        <Route
            exact
            path="/"
            element={<Main />
          
          }
          />

          <Route
            exact
            path="/sajjan"
            element={<Home />}
          />


          <Route
            path="/about"
            element={<About/>}
          />


          <Route
            path="*"
            element={<Navigate to="/" />}
          />
        </Routes>
      </Router>

    </div>
  );
}

export default App