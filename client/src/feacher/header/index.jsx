import React from 'react';
import './index.css'
import { useNavigate } from 'react-router-dom';

const Header = () => {
    let navigate = useNavigate();
    const routeChange = (key) => {
      let path = key;
      navigate(path);
    }
    return (
        
<div className='headercant' >

<nav class="navbar bg-body-tertiary">
  <div class="container-fluid">
    <a class="navbar-brand" onClick={routeChange('/')} href="#" >Sajjan</a>
    <ul className="nav justify-content-end">
            <li className="nav-item">
                <a className="nav-link" onClick={routeChange('/resume')} href="#resume" >Resume</a>
            </li>
            <li className="nav-item">
                <a className="nav-link" onClick={routeChange('/Gitproject')} href="#Gitproject">Git Projects</a>
            </li>
            <li className="nav-item">
                <a className="nav-link" onClick={routeChange('/personal')} href="#personal">Personal</a>
            </li>
         
        </ul>
  </div>
</nav>

</div>

    )
}

export default Header;
