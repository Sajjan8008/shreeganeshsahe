import React from 'react';
import { Component } from 'react';
import './homepage.css';
import ScrollableAnchor from 'react-scrollable-anchor';
import Typing from 'react-typing-animation';
import { Card } from 'react-bootstrap';
import About from '../about/about';
import Contact from '../contact/contact';
// import About from '../about/about'
class Homepage extends Component {
  render() {
    return (
      <div align='right'>
          {/* <About/> */}
        <div className='img-1'>
        <ScrollableAnchor id={'section1'}>
              <span><br /></span>
            </ScrollableAnchor>
          <Card className='hcard'>
        
            <span className='space'></span>

            <div className='c'>
              <Card className='clear'>
                <Card.Img
                  src={require('../../assets/bnrr.jpg')}
                  className='pic'
                />
                <span className='sp'></span>

                <h1 className='text'>
                  <span className='a'>Sajjan</span>{' '}
                  <span className='n'>Kumar</span>{' '}
                </h1>

                <h4 className='type'>
                  <div>
                    I'm A
                    <Typing loop='true'>
                      <Typing.Speed ms={50} />
                      <span>Node Devloper</span>
                      <Typing.Delay ms={1000} />
                      <Typing.Backspace count={20} />
                      <span>Programmer</span>
                      <Typing.Delay ms={1000} />
                      <Typing.Backspace count={20} />
                      <span>And Web Developer</span>
                      <Typing.Delay ms={1000} />
                      <Typing.Backspace count={20} />
                    </Typing>
                  </div>
                </h4>
              </Card>
            </div>
          </Card>

        </div>
        <About />
        <Contact/>
      </div>
    );
  }
}

export default Homepage;
