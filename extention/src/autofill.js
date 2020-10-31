import ManagerApi from "./managerAPI.js";

/*global chrome*/
function Autofill(props) {
  console.log("Here");

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

        addEventListener(logins);
        //TODO:ask user if he wants to autofill?
        //TODO: autofill
      });
    });
  });

  return null;
}

async function getLoginsForSite(token, key) {
  var api = new ManagerApi();
  api.setToken(token, key);
  var domain = encodeURI(document.location.host + document.location.pathname);

  var logins = await api.getLogins(undefined, domain);

  return logins.map((l) => {
    l.password = api.decodePass(l.password, l.iv);
    return l;
  });
}

function addEventListener(logins) {
  var forms = document.querySelectorAll("form");
  for (var form of forms) {
    var usernameField = form.querySelector("input[name*=user]");
    var passwordField = form.querySelector("input[type=password]");

    form = { username: usernameField, password: passwordField };

    if (usernameField !== undefined) {
      usernameField.addEventListener("click", handleClick(form, logins));
    }
    if (passwordField !== undefined) {
      passwordField.addEventListener("click", handleClick(form, logins));
    }
  }
}

function handleClick(form, logins) {
  return function () {
    console.log(form);
  };
}

export default Autofill;
