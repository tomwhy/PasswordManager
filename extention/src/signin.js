import React from "react";
import "./signin.css";

/*global chrome*/
class SignIn extends React.Component {
  constructor(props) {
    super(props);
    this.state = { username: "", password: "" };

    this.onChange = this.onChange.bind(this);
    this.storageLogin();
  }

  storageLogin() {
    chrome.storage.sync.get("user", (user) => {
      if (user.user === "") {
        return;
      }
      chrome.storage.sync.get("pass", (pass) => {
        if (pass.pass === "") {
          return;
        }

        this.props.setCredentials(user.user, pass.pass, false);
      });
    });
  }

  onChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  render() {
    return (
      <div>
        {this.props.error}
        <div class="signInForm">
          <label>username:</label>
          <input
            type="text"
            value={this.state.username}
            onChange={this.onChange}
            name="username"
          ></input>
          <label>password:</label>
          <input
            type="password"
            value={this.state.password}
            onChange={this.onChange}
            name="password"
          ></input>
          <button
            class="signIn"
            onClick={(e) =>
              this.props.setCredentials(
                this.state.username,
                this.state.password,
                false
              )
            }
          >
            Sign In
          </button>
          <button
            class="register"
            onClick={(e) =>
              this.props.setCredentials(
                this.state.username,
                this.state.password,
                true
              )
            }
          >
            Register
          </button>
        </div>
      </div>
    );
  }
}

export default SignIn;
