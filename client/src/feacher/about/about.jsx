import React, { useEffect, useState } from 'react';
import './about.css'
import ScrollableAnchor from 'react-scrollable-anchor';
import Contact from '../contact/contact';

const About = () => {
  let [data, setData] = useState({})
  useEffect(() => {
    setData(
      {
        "name": "sajjan",
        "city": "Hisar",
        "State": "Haryana"
      }
    )


  }, {})

  return (
    <>
      <div className='aboutCant' >
        <ScrollableAnchor id={'section2'}>
          <div className='mainabout' >
            <span className='atitle'>About Me</span>
            <div className='atspace'></div>
            <div>
              <p className='aheader'>
                I'm sajjan and I'm a Developer
              </p>
              <h6 className='apar'>
                Hi! My name is <span className='aname'>sajjan</span>. I am a
                Developer
              </h6>

            </div>


          </div>

        </ScrollableAnchor>
      </div>
      <Contact />

    </>
  )
}

export default About;
