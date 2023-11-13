import React from 'react';
import mainLogo from'./sg.png';
import './index.css'
function Home() {
  return (
    <div className="Home">
      <header className='mainHeader'>
        <div>
          <h1 className='' >Shree Ganeshsahe</h1>
        </div>
      </header>

      <dev className='imgspace'>
      <img className='img' src={mainLogo} />
      <div  ></div>
      </dev>


    </div>
  );
}

export default Home;
