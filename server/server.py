import flask
import database
import json
import collections
import flask_httpauth
import sys
import hashlib
import string
import random
import secrets
import flask_cors
import jwt

CONFIG_PATH = "config.json"

HTTP_UNAUTHORIZED = 401
HTTP_BAD_REQUEST = 400
HTTP_OK_EMPTY = 204

app = flask.Flask(__name__)
flask_cors.CORS(app, supports_credentials=True)
auth = flask_httpauth.HTTPBasicAuth()

with open(CONFIG_PATH) as config_file:
    config = json.load(config_file)
    api_port = config["api"]["port"]
    try:
        db = database.Database(config["sql"]["path"])
    except ConnectionRefusedError:
        print("Could not connected to database", file=sys.stderr)
        exit(1)


@auth.verify_password
def verify(username, password):
    try:
        return db.validate_password(username, hash_password(username, password))
    except database.AuthenticationError:
        return None


@app.route("/logins", methods=["POST", "GET"])
@auth.login_required
def logins():
    if flask.request.method == "POST":
        arguments = collections.defaultdict(lambda: None,  flask.request.form)

        if "id" in flask.request.form:
            try:
                db.change_login(auth.current_user(), arguments["id"], arguments["username"], arguments["password"],
                                arguments["iv"], arguments["domain"])
            except RuntimeError as e:
                return str(e), HTTP_BAD_REQUEST
        else:
            db.add_login(auth.current_user(), arguments["password"], arguments["iv"],
                         arguments["username"], arguments["domain"])

        return "", HTTP_OK_EMPTY
    else:
        arguments = collections.defaultdict(lambda: None, flask.request.args)
        credentials = db.get_logins(
            auth.current_user(), arguments["username"], arguments["domain"])
        return flask.jsonify([credential.to_json() for credential in credentials])


@app.route("/register", methods=["POST"])
def register():
    try:
        db.register_user(flask.request.form["username"], hash_password(
            flask.request.form["username"], flask.request.form["password"]))
    except KeyError:
        return "Username and password are required", HTTP_BAD_REQUEST
    except database.AuthenticationError:
        return "Username already exists", HTTP_BAD_REQUEST
    return "", HTTP_OK_EMPTY


def hash_password(username: str, password: str) -> bytes:
    seed = sum(hashlib.sha256(username.encode()).digest())
    salt = "".join(random.Random(seed).choices(
        string.ascii_letters + string.digits, k=32))
    return hashlib.sha512((password + salt).encode()).digest()


if __name__ == "__main__":
    # in order to generate a self signed certificate (for the scope of this project is good enough) you can run
    # openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem
    app.run(ssl_context=("cert.pem", "key.pem"), port=api_port)
