import React from "react";
import "./signin.css";

class SignIn extends React.Component {
  constructor(props) {
    super(props);
    this.state = { username: "", password: "" };

    this.onChange = this.onChange.bind(this);
  }

  onChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  render() {
    let errorMsg = <p></p>;
    if (this.props.error !== undefined) {
      errorMsg = <p style={{ color: "red" }}>{this.props.error}</p>;
    }

    return (
      <div>
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
              this.props.setCrandials(
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
              this.props.setCrandials(
                this.state.username,
                this.state.password,
                true
              )
            }
          >
            Register
          </button>
          <div class="errorMsg">{errorMsg}</div>
        </div>
      </div>
    );
  }
}

export default SignIn;
