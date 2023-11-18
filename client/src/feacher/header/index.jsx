import React from 'react';
import './index.css'
const Header = () => {
    return (
<div className='headercant' >

<nav class="navbar bg-body-tertiary">
  <div class="container-fluid">
    <a class="navbar-brand">Sajjan</a>
    <ul className="nav justify-content-end">
            <li className="nav-item">
                <a className="nav-link"  href="#">Resume</a>
            </li>
            <li className="nav-item">
                <a className="nav-link" href="#">Git Projects</a>
            </li>
            <li className="nav-item">
                <a className="nav-link" href="#">Personal</a>
            </li>
         
        </ul>
  </div>
</nav>

</div>

    )
}

export default Header;
