import React from "react";
import LogIn from "./signin";
import ManagerApi from "./managerAPI.js";
import Logins from "./logins.js";
import { ErrorWindow } from "./errorWindow";

class ExtentionPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loggedIn: false, errorMsg: undefined };

    this.api = new ManagerApi();
  }

  signIn = (username, password) => {
    if (username === "") {
      this.setState({ errorMsg: "Username field is required" });
      return;
    }

    if (password === "") {
      this.setState({ errorMsg: "Password field is required" });
      return;
    }

    this.api
      .login(username, password)
      .then((success) => {
        if (!success) {
          this.setState({ errorMsg: "Username Or Password are incorrect" });
          return;
        }
        this.setState({ loggedIn: this.api.loggedIn() });
      })
      .catch((e) => {
        this.setState({ errorMsg: e.message });
      });

    //TODO: set state here to loading
  };

  signUp = (username, email, password) => {
    if (username === "") {
      this.setState({ errorMsg: "Username field is required" });
      return;
    }

    if (email === "") {
      this.setState({ errorMsg: "Email field is required" });
      return;
    }

    if (password === "") {
      this.setState({ errorMsg: "Password field is required" });
      return;
    }

    this.api
      .register(username, email, password)
      .then((success) => {
        if (!success) {
          this.setState({ errorMsg: "There was a problem registering" });
          return;
        }
        this.setState({ loggedIn: this.api.loggedIn() });
      })
      .catch((e) => {
        this.setState({ errorMsg: e.message });
      });

    //TODO: set state here to loading
  };

  setToken = (token, key) => {
    this.api
      .setToken(token, key)
      .then((res) => {
        this.setState({ loggedIn: this.api.loggedIn() });
      })
      .catch((e) => {
        this.setState({ errorMsg: e.message });
      });
  };

  onErrorClose = (e) => {
    this.setState({ errorMsg: undefined });
  };

  onLogout = () => {
    this.api.logout();
    this.setState({ loggedIn: this.api.loggedIn() });
  };

  render() {
    const error =
      this.state.errorMsg !== undefined ? (
        <ErrorWindow error={this.state.errorMsg} onClose={this.onErrorClose} />
      ) : null;

    return this.state.loggedIn ? (
      <Logins api={this.api} onLogout={this.onLogout} />
    ) : (
      <LogIn
        error={error}
        signIn={this.signIn}
        signUp={this.signUp}
        setToken={this.setToken}
      />
    );
  }
}

export default ExtentionPage;
