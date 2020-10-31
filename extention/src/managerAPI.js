import { Base64 } from "./base64.mjs";
const crypto = require("crypto");

/*global chrome*/
class ManagerApi {
  API_URL = `https://127.0.0.1:9000`;

  constructor() {
    this.token = "";
    this.key = undefined;
  }

  async setToken(token, key) {
    let success = await fetch(`${this.API_URL}/logins`, {
      method: "HEAD",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.ok)
      .catch((e) => {
        chrome.storage.sync.set({ token: undefined, key: undefined });
        throw e;
      });

    if (success) {
      this.token = token;
      this.key = key.data;
    } else {
      chrome.storage.sync.set({ token: undefined, key: undefined });
    }

    return success;
  }

  generateKey(username, password) {
    return crypto
      .createHash("sha256")
      .update(password + username)
      .digest();
  }

  async login(username, password) {
    let body = new FormData();
    body.append("username", username);
    body.append("password", password);

    return await fetch(`${this.API_URL}/login`, {
      method: "POST",
      body: body,
    })
      .then(async (res) => {
        if (res.ok) {
          this.token = await res.text();
          this.key = this.generateKey(username, password);
          chrome.storage.sync.set({
            token: this.token,
            key: JSON.stringify(this.key),
          });
          return true;
        } else if (res.status === 409) {
          throw Error("Username or password are incorrect");
        }
        throw Error(await res.text());
      })
      .catch((e) => {
        throw e;
      });
  }

  loggedIn() {
    return this.token !== "";
  }

  async register(username, email, password) {
    let data = new FormData();
    data.append("username", username);
    data.append("email", email);
    data.append("password", password);
    return await fetch(`${this.API_URL}/register`, {
      method: "POST",
      body: data,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw Error(await res.text());
        }

        return await this.login(username, password);
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
          Authorization: `Bearer ${this.token}`,
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
          Authorization: `Bearer ${this.token}`,
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
        Authorization: `Bearer ${this.token}`,
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
    this.token = "";
    this.key = undefined;

    chrome.storage.sync.set({ token: undefined });
  }
}

export default ManagerApi;
