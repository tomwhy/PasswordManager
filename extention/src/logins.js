import React from "react";
import Popup from "reactjs-popup";
import { ErrorWindow } from "./errorWindow.js";
import { Base64 } from "./base64.mjs";
import { Form, Input } from "./form.js";

class LoginEntry extends React.Component {
  constructor(props) {
    super(props);
    this.state = { message: undefined, editOpen: false };

    this.username = null;
    this.domain = null;

    if (this.props.login.username !== "") {
      this.username = <span>Username: {this.props.login.username}</span>;
    }
    if (this.props.login.domain !== "") {
      this.domain = <span>Domain: {this.props.login.domain}</span>;
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

        <div class="row">
          <div class="col">{this.username}</div>
          <div class="col">
            <button
              onClick={this.onCopyClick}
              class="btn btn-light float-right d-inline"
            >
              Copy Password
            </button>
          </div>
        </div>
        <div class="row">
          <div class="col">{this.domain}</div>
          <div class="col">
            <button
              onClick={this.onEditClick}
              class="btn btn-warning float-right d-inline"
            >
              Edit
            </button>
          </div>
        </div>

        {this.state.message === undefined ? null : this.state.message}
      </div>
    );
  }
}

class AddLoginWindow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: undefined,
    };

    this.onSubmit = this.onSubmit.bind(this);
  }

  areInputValid(username, password, domain) {
    if (!/.+/.test(password)) {
      throw Error("Password must not be empty");
    }

    if (
      domain !== "" &&
      !/(?:https?:\/\/)?[\w.-]+(?:\.[\w.-]+)[\w$\-_.+!*'(),",?;\/:@=&]*/.test(
        domain
      )
    ) {
      throw Error("Invalid URL");
    }
  }

  onSubmit(e) {
    try {
      this.areInputValid(e.username, e.password, e.domain);
    } catch (err) {
      this.setState({ error: err.message });
      return;
    }

    if (this.props.passId !== undefined) {
      this.props.api
        .editLogin(this.props.passId, e.username, e.password, e.domain)
        .catch((err) => {
          this.setState({ error: err.message, open: true });
        });
    } else {
      this.props.api.addLogin(e.username, e.password, e.domain).catch((err) => {
        this.setState({ error: err.message, open: true });
      });
    }

    this.closeWindow(true);
  }

  closeWindow = (reload) => {
    this.setState({
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
        <div class="container border border-dark bg-light">
          {errorWindow}
          <Form onSubmit={this.onSubmit}>
            <Input
              name="username"
              label="username: "
              init={this.props.username}
            />
            <Input
              name="password"
              type="password"
              label="password: "
              init={this.props.password}
            />
            <Input name="domain" label="domain: " init={this.props.domain} />
            <button type="submit" class="btn btn-primary">
              Add
            </button>
          </Form>
        </div>
      </Popup>
    );
  }
}

const spinner = (
  <div class="container m-auto">
    <div class="spinner-border "></div>
  </div>
);

class Logins extends React.Component {
  handlerError = (e) => {
    return (
      <ErrorWindow
        error={e.message}
        onClose={() => this.setState({ rows: spinner })}
      />
    );
  };

  constructor(props) {
    super(props);
    this.state = {
      addPassOpen: false,
      rows: spinner,
    };

    this.getLogins()
      .then((res) => this.setState({ rows: res }))
      .catch(this.handlerError);
  }

  async getLogins() {
    const logins = await this.props.api.getLogins(undefined, undefined);

    return (
      <div class="container-fluid mx-auto">
        {logins.map((l) => {
          return (
            <div key={l.id} class="container border">
              <LoginEntry
                login={l}
                api={this.props.api}
                time={1.5}
                onLoginEdited={() => {
                  this.getLogins()
                    .then((res) => this.setState({ rows: res }))
                    .catch(this.handlerError);
                }}
              />
            </div>
          );
        })}
      </div>
    );
  }

  onAddPassClosed = (reload) => {
    if (reload) {
      this.getLogins()
        .then((res) => this.setState({ rows: res }))
        .catch(this.handlerError);
    }

    this.setState({ addPassOpen: false });
  };

  render() {
    return (
      <div>
        <nav class="navbar navbar-expand-sm bg-light">
          <ul class="navbar-nav">
            <li class="nav-item">
              <button onClick={this.props.onLogout} class="btn btn-danger">
                Log out
              </button>
            </li>
          </ul>
        </nav>
        <nav class="navbar navbar-expand-sm fixed-bottom">
          <button
            class="btn btn-light"
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
        </nav>
        <AddLoginWindow
          open={this.state.addPassOpen}
          onClose={this.onAddPassClosed}
          api={this.props.api}
        />

        {this.state.rows}
      </div>
    );
  }
}

export default Logins;
