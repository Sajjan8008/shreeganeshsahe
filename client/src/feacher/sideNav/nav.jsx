import React from 'react';
import { Component } from 'react';
import './nav.css';

import { Navbar, Card, ListGroup, ListGroupItem } from 'react-bootstrap';
import { goToAnchor, configureAnchors } from 'react-scrollable-anchor';

import {
  GithubOutlined,
  CopyrightOutlined,
  TwitterOutlined
} from '@ant-design/icons';

class SideNav extends Component {
  constructor(props) {
    super(props);
    this.onSelect = this.onSelect.bind(this);
    this.toggleNav = this.toggleNav.bind(this);
  }

  onSelect(e) {
    console.log('onSelect');
  }

  toggleNav() {
    console.log('toggle..');
  }

  render() {
    configureAnchors({ scrollDuration: 1000 });
    return (
      <Navbar className='home'>
        <Card className='card'>
          <Card.Img
            src={require('../../assets/home.jpg')}
            variant='top'
            className='sig'
          />

          <Card.Body>
            <Card.Text>
              <div className='space'></div>
              <ListGroup variant='flush'>
                <ListGroupItem className='list'>
                  <span className='link' onClick={() => goToAnchor('section1')}>
                    Home
                  </span>
                </ListGroupItem>
                <ListGroupItem className='list'>
                  <span className='link' onClick={() => goToAnchor('section2')}>
                    About
                  </span>
                </ListGroupItem>
                <ListGroupItem className='list'>
                  <span className='link' onClick={() => goToAnchor('section3')}>
                    Portfolio
                  </span>
                </ListGroupItem>
                <ListGroupItem className='list'>
                  <span className='link' onClick={() => goToAnchor('section4')}>
                    Contact
                  </span>
                </ListGroupItem>

                <ListGroupItem className='list'>
                  <span className='link' onClick={() => goToAnchor('section5')}>
                    Resume
                  </span>
                </ListGroupItem>

                <ListGroupItem className='list'>
                  <span className='link' onClick={() => goToAnchor('section6')}>
                    Git projects
                  </span>
                </ListGroupItem>
                <ListGroupItem className='list'>
                  <span className='link' onClick={() => goToAnchor('section7')}>
                    Personal
                  </span>
                </ListGroupItem>
              </ListGroup>
            </Card.Text>
            <div className='spaces'></div>
            {/* <ListGroup horizontal>
              <ListGroup.Item className='li'>
                <a href='https://github.com/' className='link'>
                  <GithubOutlined />
                </a>
              </ListGroup.Item>
            </ListGroup> */}
          </Card.Body>
        </Card>
        
      </Navbar>
    );
  }
  componentDidMount() {}

}

export default SideNav;
