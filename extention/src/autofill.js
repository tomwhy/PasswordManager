import ManagerApi from "./managerAPI.js";
import { Base64 } from "./base64.mjs";
import Popup from "reactjs-popup";
import { useState } from "react";
import React from "react";
import ReactDom from "react-dom";

var usernames = [];
var passwords = [];

/*global chrome*/
function Autofill(props) {
  chrome.storage.sync.get("token", (data) => {
    if (data.token === undefined) {
      return;
    }
    chrome.storage.sync.get("key", (keyData) => {
      if (keyData.key === undefined) {
        return;
      }

      getLoginsForSite(data.token, JSON.parse(keyData.key)).then((logins) => {
        if (logins.length === 0) return;

        addEventListeners(logins);
      });
    });
  });

  return null;
}

async function getLoginsForSite(token, key) {
  var api = new ManagerApi();
  if (!(await api.setToken(token, key))) {
    return;
  }

  var logins = await api.getLogins(undefined, document.location.host);

  return logins.map((l) => {
    l.password = api.decodePass(l.password, Base64.toUint8Array(l.iv));
    return l;
  });
}

function isUsernameField(field) {
  const usernameRegex = /^user(?:name)?$|^uname$/;

  const name = field.attributes.getNamedItem("name")?.value ?? "";
  const formcontrolname =
    field.attributes.getNamedItem("formcontrolname")?.value ?? "";

  return usernameRegex.test(name) || usernameRegex.test(formcontrolname);
}

function isPasswordField(field) {
  const type = field.attributes.getNamedItem("type")?.value ?? "";
  return type === "password";
}

function addEventListeners(logins) {
  for (const field of document.querySelectorAll("input")) {
    if (isUsernameField(field)) {
      usernames.push(field);
      field.addEventListener("click", handleClick(logins, field));
    } else if (isPasswordField(field)) {
      passwords.push(field);
      field.addEventListener("click", handleClick(logins, field));
    }
  }
}

function SelectPopup(props) {
  const [open, setOpen] = useState(true);

  const onClose = () => {
    setOpen(false);
  };

  return (
    <Popup
      open={open}
      closeOnDocumentClick
      onClose={onClose}
      nested={props.nested}
    >
      <div class="modal">
        {props.logins.map((l) => {
          return (
            <button
              key={l.id}
              onClick={() => {
                fill(l);
                onClose();
              }}
            >
              {l.username}
            </button>
          );
        })}
      </div>
    </Popup>
  );
}

function fill(login) {
  for (const userField of usernames) {
    userField.value = login.username;
  }

  for (const passwordField of passwords) {
    passwordField.value = login.password;
  }
}

function handleClick(logins, element) {
  return function () {
    ReactDom.render(<SelectPopup logins={logins} open={true} />, element);
  };
}

export default Autofill;
