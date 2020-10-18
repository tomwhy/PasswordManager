import { Base64 } from "./base64.mjs";
const crypto = require("crypto");

/*global chrome*/
class ManagerApi {
  API_URL = `https://127.0.0.1:9000`;

  constructor() {
    this.auth = "";
    this.key = "";
  }

  async login(username, password) {
    console.log(username);
    console.log(password);
    this.auth = `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`;

    return await this.authenticate()
      .then((auth) => {
        if (!auth) {
          this.auth = "";
          return false;
        }
        this.key = crypto.createHash("sha256").update(password).digest();

        chrome.storage.sync.set({ user: username, pass: password });

        return true;
      })
      .catch((e) => {
        this.auth = "";
        throw e;
      });
  }

  async authenticate() {
    return await fetch(`${this.API_URL}/logins`, {
      headers: {
        Authorization: `${this.auth}`,
      },
      method: "HEAD",
    })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status !== 401) throw Error(await res.text());
          else throw Error("Username or password are incorrect");
        }
        return true;
      })
      .catch((error) => {
        throw error;
      });
  }

  loggedIn() {
    return this.auth !== "";
  }

  async register(username, password) {
    let data = new FormData();
    data.append("username", username);
    data.append("password", password);
    return await fetch(`${this.API_URL}/register`, {
      method: "POST",
      body: data,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw Error(await res.text());
        }

        await this.login(username, password);
      })
      .catch((e) => {
        throw e;
      });
  }

  async addLogin(username, password, domain) {
    try {
      let [encrypted, iv] = this.encryptPass(password);

      let form = new FormData();
      form.append("password", encrypted);
      form.append("iv", Base64.fromUint8Array(iv));
      if (username !== undefined) {
        form.append("username", username);
      }
      if (domain !== undefined) {
        form.append("domain", domain);
      }

      let res = await fetch(`${this.API_URL}/logins`, {
        method: "POST",
        body: form,
        headers: {
          Authorization: `${this.auth}`,
        },
      });
      return res.ok;
    } catch (error) {
      throw error;
    }
  }

  async editLogin(id, username, password, domain) {
    try {
      let form = new FormData();

      form.append("id", id);
      if (password !== undefined) {
        let [encrypted, iv] = this.encryptPass(password);
        form.append("password", encrypted);
        form.append("iv", Base64.fromUint8Array(iv));
      }

      if (username !== undefined) {
        form.append("username", username);
      }

      if (domain !== undefined) {
        form.append("domain", domain);
      }

      let res = await fetch(`${this.API_URL}/logins`, {
        method: "POST",
        body: form,
        headers: {
          Authorization: `${this.auth}`,
        },
      });
      return res.ok;
    } catch (error) {
      throw error;
    }
  }

  async getLogins(username, domain) {
    let url = new URL(`${this.API_URL}/logins`);
    let params = {};
    if (username !== undefined) {
      params.username = username;
    }
    if (domain !== undefined) {
      params.domain = domain;
    }

    Object.keys(params).forEach((key) =>
      url.searchParams.append(key, params[key])
    );

    return await fetch(url, {
      headers: {
        Authorization: `${this.auth}`,
      },
    })
      .then(async (res) => {
        return await res.json();
      })
      .catch((error) => {
        throw error;
      });
  }

  encryptPass(password) {
    const iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv("aes-256-cbc", this.key, iv);
    cipher.update(password);
    return [cipher.final("hex"), iv];
  }

  decodePass(password, iv) {
    let cipher = crypto.createDecipheriv("aes-256-cbc", this.key, iv);
    cipher.update(password, "hex", "utf8");
    return cipher.final("utf8");
  }

  logout() {
    this.auth = "";
    this.key = "";

    chrome.storage.sync.set({ user: "", pass: "" });
  }
}

export default ManagerApi;
