import React from 'react';
import { Col, ListGroup } from 'react-bootstrap';
import Header from '../header';
import ScrollableAnchor from 'react-scrollable-anchor';

import './index.css'
const Personal = () => {
  return (

    <div className='mainCant' >

      <Header />
      <div className='heading' >
        <h1>Personal</h1>
      </div>
      <div className='listcls' >

        <ListGroup className='listGroup' >
          <ListGroup.Item action variant="dark">
            Dark
          </ListGroup.Item>
          <div className='listAbout'>
            <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Illum modi omnis tempora optio porro ipsum suscipit voluptatum ad distinctio ipsa iste inventore hic asperiores numquam, officia expedita blanditiis vero. Recusandae voluptas sapiente quas, beatae velit ab facilis doloremque fugit perferendis consequatur ipsum voluptatem illo maxime ad! Ipsum modi cum repudiandae!</p>
          </div>

          <ListGroup.Item action variant="dark">
            Dark
          </ListGroup.Item>
          <div className='listAbout'>
            <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Illum modi omnis tempora optio porro ipsum suscipit voluptatum ad distinctio ipsa iste inventore hic asperiores numquam, officia expedita blanditiis vero. Recusandae voluptas sapiente quas, beatae velit ab facilis doloremque fugit perferendis consequatur ipsum voluptatem illo maxime ad! Ipsum modi cum repudiandae!</p>
          </div>

          <ListGroup.Item action variant="dark">
            Dark
          </ListGroup.Item>
          <div className='listAbout'>
            <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Illum modi omnis tempora optio porro ipsum suscipit voluptatum ad distinctio ipsa iste inventore hic asperiores numquam, officia expedita blanditiis vero. Recusandae voluptas sapiente quas, beatae velit ab facilis doloremque fugit perferendis consequatur ipsum voluptatem illo maxime ad! Ipsum modi cum repudiandae!</p>
          </div>

          <ListGroup.Item action variant="dark">
            Dark
          </ListGroup.Item>
          <div className='listAbout' >
            <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Illum modi omnis tempora optio porro ipsum suscipit voluptatum ad distinctio ipsa iste inventore hic asperiores numquam, officia expedita blanditiis vero. Recusandae voluptas sapiente quas, beatae velit ab facilis doloremque fugit perferendis consequatur ipsum voluptatem illo maxime ad! Ipsum modi cum repudiandae!</p>
          </div>
          <ListGroup.Item action variant="dark">
            Dark
          </ListGroup.Item>
          <div className='listAbout' >
            <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Illum modi omnis tempora optio porro ipsum suscipit voluptatum ad distinctio ipsa iste inventore hic asperiores numquam, officia expedita blanditiis vero. Recusandae voluptas sapiente quas, beatae velit ab facilis doloremque fugit perferendis consequatur ipsum voluptatem illo maxime ad! Ipsum modi cum repudiandae!</p>
          </div>
        </ListGroup>

      </div>
    </div>
  )
}

export default Personal;