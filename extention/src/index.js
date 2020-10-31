import React from "react";
import ReactDom from "react-dom";
import ExtentionPage from "./extentionPage.js";
import Autofill from "./autofill.js";

function App(props) {
  const content = props.extPage ? <ExtentionPage /> : <Autofill />;
  return content;
}

function isExtPage() {
  const extPageAttr = document.body.attributes.getNamedItem("passmanagerext");
  return extPageAttr !== null && extPageAttr.value === "true";
}

const extRoot = document.createElement("div");
extRoot.id = "react-password-manager";
document.body.appendChild(extRoot);

ReactDom.render(<App extPage={isExtPage()} />, extRoot);
