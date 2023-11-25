import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import About from './feacher/about/about';
import Personal from './feacher/Personal/index';
import Gitproject from './feacher/GItProjects/index';
import Resume from './feacher/Personal/index';
import Home from './feacher/homepage/homepage';
import Main from './feacher/main/index';

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
            element={<About />}
          />
          <Route
            path="/resume"
            element={<Resume />}
          />

          <Route
            path="/Gitproject"
            element={<Gitproject />}
          />
 <Route
            path="/personal"
            element={<Personal />}
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