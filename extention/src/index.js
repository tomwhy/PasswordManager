import React from "react";
import ReactDom from "react-dom";
import "./signin";
import SignIn from "./signin";

const SERVER_IP = "127.0.0.1";
const SERVER_PORT = 9000;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loggedIn: false, errorMsg: "" };
    this.authenticate = this.authenticate.bind(this);
  }

  authenticate(username, password, register) {
    if (username === "") {
      this.setState({ errorMsg: "Username field is required" });
      return;
    }

    if (password === "") {
      this.setState({ errorMsg: "Password field is required" });
      return;
    }

    if (register) {
    }

    fetch(`https://${SERVER_IP}:${SERVER_PORT}/logins`, {
      headers: {
        "WWW-Authenticate": `Basic ${Buffer.from(
          `${username}:${password}`
        ).toString("base64")}`,
      },
    })
      .then((res) => {
        if (res.ok) {
          this.setState({ loggedIn: true });
          console.log(res.json());
        } else if (res.status === 401) {
          this.setState({ errorMsg: "Username or password are incorrect" });
          console.log(res);
        }
      })
      .catch((error) => {
        this.setState({ errorMsg: "Could not connect to server" });
      });
  }

  render() {
    return (
      <SignIn error={this.state.errorMsg} setCrandials={this.authenticate} />
    );
  }
}

ReactDom.render(<App />, document.getElementById("root"));
