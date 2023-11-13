import React from 'react';

// import { Card } from 'react-bootstrap';
import './contact.css';
// import ScrollableAnchor from 'react-scrollable-anchor';
// import ScrollTrigger from 'react-scroll-trigger';

class Contact extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      email: '',
      message: '',
      visible: false,
    };
  }
  onEnterViewport() {
    this.setState({
      visible: true,
    });
  }

  // handleSubmit(e) {
  //   e.preventDefault();
  //   axios({
  //     method: 'POST',
  //     url: 'http://localhost:5000/send',
  //     data: this.state,
  //   }).then((response) => {
  //     if (response.data.status === 'success') {
  //       alert('Message Sent.');
  //       this.resetForm();
  //     } else if (response.data.status === 'fail') {
  //       alert('Message failed to send.');
  //     }
  //   });
  // }

  resetForm() {
    this.setState({ name: '', email: '', message: '' });
  }

  render() {
    return (
      <div className='cimg'>
        <h1>hello</h1>
        {/* <div className={this.state.visible ? 'pfadeIn' : 'pfadeOut'}> */}
          {/* <ScrollableAnchor id={'section4'}>
            <div>
              <span></span>
            </div>
          </ScrollableAnchor>
          <Card className='ccard'>
            <span className='ctitle'>Send Me A Message!</span>
            <form
              id='contact-form'
              onSubmit={this.handleSubmit.bind(this)}
              method='POST'
            >
              <div className='form-group'>
                <label htmlFor='name' className='clabel'>
                  Name
                </label>
                <input
                  type='text'
                  className='form-control'
                  id='name'
                  value={this.state.name}
                  onChange={this.onNameChange.bind(this)}
                />
              </div>
              <div className='form-group'>
                <label htmlFor='exampleInputEmail1' className='clabel'>
                  Email address
                </label>
                <input
                  type='email'
                  className='form-control'
                  id='email'
                  aria-describedby='emailHelp'
                  value={this.state.email}
                  onChange={this.onEmailChange.bind(this)}
                />
              </div>
              <div className='form-group'>
                <label htmlFor='message' className='clabel'>
                  Message
                </label>
                <textarea
                  className='form-control'
                  rows='5'
                  id='message'
                  value={this.state.message}
                  onChange={this.onMessageChange.bind(this)}
                />
              </div>
              <button type='submit' className='cbtn'>
                Submit
              </button>
            </form>
          </Card>
        </div>
        <ScrollTrigger onEnter={() => this.onEnterViewport()}>
          <span></span>
        </ScrollTrigger> */}
      </div>
    );
  }

  onNameChange(event) {
    this.setState({ name: event.target.value });
  }

  onEmailChange(event) {
    this.setState({ email: event.target.value });
  }

  onMessageChange(event) {
    this.setState({ message: event.target.value });
  }
}

export default Contact;
