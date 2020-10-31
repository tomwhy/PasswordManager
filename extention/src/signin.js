import React from "react";
import Form from "./Form.js";
import "./signin.css";

/*global chrome*/
class LoginIn extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: undefined };

    this.onChange = this.onChange.bind(this);
    this.storageLogin();
  }

  storageLogin() {
    chrome.storage.sync.get("token", (data) => {
      if (data.token === undefined) {
        return;
      }
      chrome.storage.sync.get("key", (keyData) => {
        if (keyData.key === undefined) {
          return;
        }

        this.props.setToken(data.token, JSON.parse(keyData.key));
      });
    });
  }

  onChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  signIn = (credintails) => {
    this.props.signIn(credintails.username, credintails.password);
  };

  signUp = (credintails) => {
    this.props.signUp(
      credintails.username,
      credintails.email,
      credintails.password
    );
  };

  render() {
    return (
      <div>
        {this.props.error}
        <Form onSubmit={this.signIn}>
          <label>Username: </label>
          <input name="username" type="text" />
          <label>Password: </label>
          <input name="password" type="password" />
          <input type="submit" value="Log In" />
        </Form>

        <Form onSubmit={this.signUp}>
          <label>Username: </label>
          <input name="username" type="text" />
          <label>Email: </label>
          <input name="email" type="email" />
          <label>Password: </label>
          <input name="password" type="password" />
          <input type="submit" value="Register" />
        </Form>
      </div>
    );
  }
}

export default LoginIn;
