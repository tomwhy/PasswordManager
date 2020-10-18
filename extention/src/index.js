import React from "react";
import ReactDom from "react-dom";
import SignIn from "./signin";
import ManagerApi from "./managerAPI.js";
import Logins from "./logins.js";
import { ErrorWindow } from "./errorWindow";

/*global chrome*/
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loggedIn: false, errorMsg: undefined };

    this.api = new ManagerApi();
  }

  authenticate = (username, password, register) => {
    if (username === "") {
      this.setState({ errorMsg: "Username field is required" });
      return;
    }

    if (password === "") {
      this.setState({ errorMsg: "Password field is required" });
      return;
    }

    var promise;

    if (register) {
      promise = this.api.register(username, password);
    } else {
      promise = this.api.login(username, password);
    }

    promise
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
  };

  onErrorClose = (e) => {
    this.setState({ errorMsg: undefined });
  };

  onLogout = () => {
    console.log("Here");
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
      <SignIn error={error} setCredentials={this.authenticate} />
    );
  }
}

ReactDom.render(<App />, document.getElementById("root"));
