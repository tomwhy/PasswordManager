import React from "react";

export function Input(props) {
  let label = null;
  if (props.label !== undefined) {
    label = (
      <div class="input-group-prepend">
        <span class="input-group-text">{props.label}</span>
      </div>
    );
  }

  const inputType = props.type !== undefined ? props.type : "text";

  return (
    <div class="input-group mb-3">
      {label}
      <input
        type={inputType}
        id={props.name}
        class="form-control"
        value={props.value}
        onChange={props.onChange}
      />
    </div>
  );
}

export class Form extends React.Component {
  constructor(props) {
    super(props);

    let state = {};

    React.Children.map(this.props.children, (c) => {
      state[c.props.name] = c.props.init ?? "";
    });

    this.state = state;
  }

  onChange = (e) => {
    if (e.currentTarget.id !== undefined) {
      this.setState({ [e.currentTarget.id]: e.currentTarget.value });
    }
  };

  onSubmit = (e) => {
    e.preventDefault();
    console.log(this.state);
    if (this.props.onSubmit !== undefined) {
      this.props.onSubmit(this.state);
    }
  };

  render() {
    const children = React.Children.map(this.props.children, (c) => {
      if (c.props.name === undefined) {
        return c;
      }

      let inputProps = Object.create(c.props);
      inputProps.onChange = this.onChange;
      inputProps.value = this.state[inputProps.name];

      return Input(inputProps);
    });

    return <form onSubmit={this.onSubmit}>{children}</form>;
  }
}
