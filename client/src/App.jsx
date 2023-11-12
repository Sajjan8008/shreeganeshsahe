import React from 'react';
import './App.css';
import Home from '../src/pages/home/index'
import Header from '../src/feacher/header/index'
import SideNav from '../src/feacher/sideNav/nav.jsx'
import Homepage from '../src/feacher/homepage/homepage.jsx';
import About from '../src/feacher/about/about.jsx';
import Contact from '../src/feacher/contact/contact.jsx';

function App() {
  return (
    <div className="App">
      <Homepage />
      <SideNav />
      {/* <Contact /> */}
      <About />
    </div>
  );
}

export default App;
