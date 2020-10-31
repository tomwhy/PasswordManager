import React from "react";
import Popup from "reactjs-popup";
import { ErrorWindow } from "./errorWindow.js";
import { Base64 } from "./base64.mjs";
import "./logins.css";

class LoginEntry extends React.Component {
  constructor(props) {
    super(props);
    this.state = { message: undefined, editOpen: false };

    this.username = null;
    this.domain = null;

    if (this.props.login.username !== "") {
      this.username = <p>Username: {this.props.login.username}</p>;
    }
    if (this.props.login.domain !== "") {
      this.domain = <p>Domain: {this.props.login.domain}</p>;
    }
  }

  onCopyClick = (e) => {
    navigator.clipboard.writeText(
      this.props.api.decodePass(
        this.props.login.password,
        Base64.toUint8Array(this.props.login.iv)
      )
    );
    const message = <div>{"Password Copied"}</div>;

    this.setState({ message: message });
    setTimeout(
      () => this.setState({ message: undefined }),
      this.props.time * 1000
    );
  };

  onEditClick = (e) => {
    this.setState({ editOpen: true });
  };

  render() {
    return (
      <div>
        <AddLoginWindow
          open={this.state.editOpen}
          onClose={() => {
            this.setState({ editOpen: false });
            this.props.onLoginEdited();
          }}
          passId={this.props.login.id}
          username={this.props.login.username}
          domain={this.props.login.domain}
          password={this.props.api.decodePass(
            this.props.login.password,
            Base64.toUint8Array(this.props.login.iv)
          )}
          api={this.props.api}
        />

        <div>
          {this.username}
          {this.domain}
        </div>
        <button onClick={this.onCopyClick}>Copy Password</button>
        <button onClick={this.onEditClick}>Edit</button>
        {this.state.message === undefined ? null : this.state.message}
      </div>
    );
  }
}

class AddLoginWindow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: props.username,
      password: props.password,
      domain: props.domain,
      error: undefined,
    };

    this.onSubmit = this.onSubmit.bind(this);
  }

  areInputValid() {
    if (!/.+/.test(this.state.password)) {
      throw Error("Password must not be empty");
    }

    if (
      this.state.domain !== "" &&
      !/(?:https?:\/\/)?[\w.-]+(?:\.[\w.-]+)[\w$\-_.+!*'(),",?;\/:@=&]*/.test(
        this.state.domain
      )
    ) {
      throw Error("Invalid URL");
    }
  }

  onSubmit(e) {
    e.preventDefault();

    try {
      this.areInputValid();
    } catch (e) {
      this.setState({ error: e.message });
      return;
    }

    if (this.props.passId !== undefined) {
      this.props.api
        .editLogin(
          this.props.passId,
          this.state.username,
          this.state.password,
          this.state.domain
        )
        .catch((e) => {
          this.setState({ error: e.message, open: true });
        });
    } else {
      this.props.api
        .addLogin(this.state.username, this.state.password, this.state.domain)
        .catch((e) => {
          this.setState({ error: e.message, open: true });
        });
    }

    this.closeWindow(true);
  }

  closeWindow = (reload) => {
    this.setState({
      username: this.props.username,
      password: this.props.password,
      domain: this.props.domain,
      error: undefined,
    });

    if (this.props.onClose !== undefined) {
      this.props.onClose(reload);
    }
  };

  onChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  render() {
    let errorWindow = null;
    if (this.state.error !== undefined) {
      errorWindow = (
        <ErrorWindow
          error={this.state.error}
          onClose={(e) => this.setState({ error: undefined })}
          nested
        />
      );
    }

    return (
      <Popup
        open={this.props.open}
        onClose={() => this.closeWindow(false)}
        position="center center"
        nested
      >
        <div class="addLogin modal">
          {errorWindow}
          <form class="addLoginForm" onSubmit={this.onSubmit}>
            <label>Username:</label>
            <input
              type="text"
              name="username"
              onChange={this.onChange}
              value={this.state.username}
            />
            <label>Password:</label>
            <input
              type="password"
              name="password"
              onChange={this.onChange}
              value={this.state.password}
            />
            <label>Domain:</label>
            <input
              type="text"
              name="domain"
              onChange={this.onChange}
              value={this.state.domain}
            />
            <input type="submit" />
          </form>
        </div>
      </Popup>
    );
  }
}

class Logins extends React.Component {
  constructor(props) {
    super(props);
    this.state = { addPassOpen: false, tableContent: <div>Loading...</div> };

    this.getLogins()
      .then((res) => this.setState({ tableContent: res }))
      .catch((e) => this.setState({ tableContent: <div>{e.message}</div> }));
  }

  async getLogins() {
    const logins = await this.props.api.getLogins(undefined, undefined);

    return (
      <table>
        <tbody>
          {logins.map((l) => {
            return (
              <tr key={l.id}>
                <td>
                  <LoginEntry
                    login={l}
                    api={this.props.api}
                    time={1.5}
                    onLoginEdited={() => {
                      debugger;
                      this.getLogins()
                        .then((res) => this.setState({ tableContent: res }))
                        .catch((e) =>
                          this.setState({
                            tableContent: <div>{e.message}</div>,
                          })
                        );
                    }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  onAddPassClosed = (reload) => {
    if (reload) {
      this.getLogins()
        .then((res) => this.setState({ tableContent: res }))
        .catch((e) => this.setState({ tableContent: <div>{e.message}</div> }));
    }

    this.setState({ addPassOpen: false });
  };

  render() {
    return (
      <div>
        <button onClick={this.props.onLogout}>Log out</button>
        <button
          onClick={() =>
            this.setState((prevState) => {
              return {
                addPassOpen: !prevState.addPassOpen,
              };
            })
          }
        >
          Add Password
        </button>
        <AddLoginWindow
          open={this.state.addPassOpen}
          onClose={this.onAddPassClosed}
          api={this.props.api}
        />
        {this.state.tableContent}
      </div>
    );
  }
}

export default Logins;
