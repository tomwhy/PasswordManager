import React from "react";
import { Form, Input } from "./form.js";

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
      <div class="container-fluid mx-auto my-auto">
        {this.props.error}
        <div class="row justify-content-center">
          <div class="col border">
            <Form onSubmit={this.signIn}>
              <Input name="username" label="Username:" />
              <Input name="password" label="Password:" type="password" />
              <button class="btn btn-primary btn-sm" type="submit">
                Log In
              </button>
            </Form>
          </div>
          <div class="col border">
            <Form onSubmit={this.signUp}>
              <Input name="username" label="Username:" />
              <Input name="password" label="Password:" type="password" />
              <Input name="email" type="email" label="Email:" />
              <button class="btn btn-primary btn-sm" type="submit">
                Sign Up
              </button>
            </Form>
          </div>
        </div>
      </div>
    );
  }
}

export default LoginIn;
