import React from 'react';
import { useNavigate } from 'react-router-dom';
import Home from '../home';
// import Button from 'react-bootstrap/Button';
import './index.css'
function Main() {

  let navigate = useNavigate();
  const routeChange = () => {
    let path = `/sajjan`;
    navigate(path);
  }

  return (
    <>
      <Home />
    <button variant="outline-info" size="lg"
        onClick={routeChange}
       >Continue
      </button>
    </>
  )
}

export default Main;
