import React from 'react';

import './contact.css';
import ScrollableAnchor from 'react-scrollable-anchor';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
const Contact = () => {

  return (
    <div className='cimg'>

      <div >
        <ScrollableAnchor id={'section4'}>
          <div>
            <span></span>
          </div>
        </ScrollableAnchor>


      </div>
      <Form className='formcls'>
        <Form.Group className="cfadeIn" controlId="formBasicEmail">
          <Form.Label className='cfadeOut'>Name</Form.Label>
          <Form.Control type="Name" placeholder="Enter Name" />
        </Form.Group>


        <Form.Group className="cfadeIn" controlId="formBasicEmail">
          <Form.Label >Email address</Form.Label>
          <Form.Control type="email" placeholder="Enter email" />
        </Form.Group>


        <Form.Group className="cfadeIn" controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" placeholder="Password" />
        </Form.Group>
      
        <Button className='cbtn' variant="primary" type="submit">
          Submit
        </Button>
      </Form>
    </div>
  );

}

export default Contact;
