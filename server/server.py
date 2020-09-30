import flask
import database
import json
import collections
import flask_httpauth
import sys
import hashlib
import string
import random

CONFIG_PATH = "config.json"

HTTP_UNAUTHORIZED = 401
HTTP_BAD_REQUEST = 400
HTTP_OK_EMPTY = 204

app = flask.Flask(__name__)
auth = flask_httpauth.HTTPBasicAuth()


with open(CONFIG_PATH) as config_file:
    mysql_config = json.load(config_file)["mysql"]
    try:
        db = database.Database(
            mysql_config["username"], mysql_config["password"], mysql_config["host"], mysql_config["port"])
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
        db.add_login(auth.current_user(), arguments["password"],
                     arguments["username"], arguments["domain"])
        return "", HTTP_OK_EMPTY
    else:
        arguments = collections.defaultdict(lambda: None, flask.request.args)
        cradentials = db.get_logins(
            auth.current_user(), arguments["username"], arguments["domain"])
        return flask.jsonify([cradential.to_json() for cradential in cradentials])


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
    seed = sum(hashlib.sha256(username).digest())
    salt = "".join(random.Random(seed).choices(
        string.ascii_letters + string.digits, k=32))
    return hashlib.sha512(password + salt)


if __name__ == "__main__":
    # in order to generate a self signed certificate (for the scope of this project is good enough) you can run
    # openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem
    app.run(ssl_context=("cert.pem", "key.pem"))
