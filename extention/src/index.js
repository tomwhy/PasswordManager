import React from "react";
import ReactDom from "react-dom";
import ExtentionPage from "./extentionPage.js";
import Autofill from "./autofill.js";
import { Switch, Route, Router } from "react-router-dom";

function App(props) {
  return (
    <Router>
      <Switch>
        <Route path="/passManagerExtention.ext">
          <ExtentionPage />
        </Route>
        <Route path="/">
          <Autofill />
        </Route>
      </Switch>
    </Router>
  );
}

const extRoot = document.createElement("div");
extRoot.id = "react-password-manager";
document.body.appendChild(extRoot);

ReactDom.render(<App />, extRoot);
