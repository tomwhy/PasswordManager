import React from "react";

class Form extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
    this.children = React.Children.map(this.props.children, (c) => {
      if (c.props.name !== undefined) {
        if (
          this.props.init !== undefined &&
          this.props.init[c.props.name] !== undefined
        ) {
          this.state[c.props.name] = this.props.init[c.props.name];
        } else {
          this.state[c.props.name] = "";
        }

        return <span onChange={this.onChange}>{c}</span>;
      }
      return c;
    });
  }

  onChange = (e) => {
    console.log(e.target);
    if (e.target.name !== undefined) {
      this.setState({ [e.target.name]: e.target.value });
    }
  };

  onSubmit = (e) => {
    e.preventDefault();
    if (this.props.onSubmit !== undefined) {
      this.props.onSubmit(this.state);
    }
  };

  render() {
    return <form onSubmit={this.onSubmit}>{this.children}</form>;
  }
}

export default Form;
