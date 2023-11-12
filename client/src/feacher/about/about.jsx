import React from 'react';
import './about.css'
import ScrollableAnchor, { goToAnchor } from 'react-scrollable-anchor';
import { Button, Card, Col, Row } from 'react-bootstrap';
import { CalendarOutlined, GiftOutlined, HeatMapOutlined, MailOutlined, PhoneOutlined, StarOutlined } from '@ant-design/icons';
const About = () =>{
    return (
      <ScrollableAnchor id={'section2'}>
        <div>
      <span className='atitle'>About Me</span>
          <div className='atspace'></div>

          <Card>
              <Row>
                <Col>H</Col>
                <Col className='col'>
                  {/* <img src={Me} alt='Logo' className='apic' /> */}
                </Col>
                <Col>
                  <Col className='aheader'>
                    I'm sajjan and I'm a Developer
                  </Col>
                  <Col className='apar'>
                    Hi! My name is <span className='aname'>sajjan</span>. I am a
                    Developer
                  </Col>
                  <Row className='ar1'>
                    <Col className='awidth'>

                      <Col>
                        <div>
                          <form onSubmit="">
                            <div className='input-group mb-3'>
                              <input
                                disabled=""
                                onChange=""
                                className='aform-control'
                                value="file"
                                type='text'
                                name='file'
                              />
                            </div>

                        

                            {/* <div className='form-group'>
                              <Button
                                variant='primary'
                                size='lg'
                                block
                                className='abtn'
                                type='submit'
                              >
                               Downloading
                              </Button>
                            </div> */}
                          </form>
                          {/* <Button
                            variant='primary'
                            size='lg'
                            block
                            className='abtn'
                            onClick={() => goToAnchor('section2')}
                          >
                            Send Message
                          </Button>{' '} */}
                        </div>
                      </Col>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card>
      </div>
      
    </ScrollableAnchor>
    )
}

export default About;
