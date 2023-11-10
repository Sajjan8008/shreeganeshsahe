import React, { Component } from 'react';
import mainLogo from'./sg.png';
function Home() {
  return (
    <div className="Home">
      <header style={{backgroundColor:'red'}}>
        <div  >s</div>
        <div style={{backgroundColor:'yellow'}} >
          <h1>Shree Ganeshsahe</h1>
        </div>
        <div>s</div>
      </header>

      <dev>
      <img  style={{
        backgroundColor:'black',
        
      }} src={mainLogo} />
      </dev>


    </div>
  );
}

export default Home;
