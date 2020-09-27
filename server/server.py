import flask
import database
import json
import random
import os
import collections
import hashlib

CONFIG_PATH = "config.json"
SECRET_LENGTH = 32
HTTP_FORBIDDEN = 403
HTTP_BAD_REQUEST = 400
HTTP_OK_EMPTY = 204


app = flask.Flask(__name__)
app.secret_key = os.urandom(SECRET_LENGTH)
with open(CONFIG_PATH) as config_file:
    mysql_config = json.load(config_file)["mysql"]
    db = database.Database(
        mysql_config["username"], mysql_config["password"], mysql_config["host"], mysql_config["port"])


@app.route("/password", methods=["POST"])
def add_password():
    """
    adds a password to the database.
    the password would be added to the logged user
    """
    if "owner" not in flask.session:
        return "You are not authenticated", HTTP_FORBIDDEN

    arguments = collections.defaultdict(lambda: None,  flask.request.form)
    db.add_login(flask.session["owner"], arguments["password"],  # TODO: encrypt password using the owner's hashed password
                 arguments["username"], arguments["domain"])
    return "", HTTP_OK_EMPTY


@app.route("/password", methods=["GET"])
def get_password():
    if "owner" not in flask.session:
        flask.abort(HTTP_FORBIDDEN)

    arguments = collections.defaultdict(lambda: None, flask.request.args)
    cradentials = db.get_logins(flask.session["owner"], arguments["username"], arguments["domain"])
    return flask.jsonify([cradential.to_json() for cradential in cradentials])  # TODO: decrypt the password


@app.route("/login", methods=["POST"])
def login():
    """
    logs a user in.
    expectes to get username and password
    """
    pass  # TODO: log into the user's account

@app.route("/register", methods=["POST"])
def register():
    """
    logs a user in.
    expectes to get username and password
    """
    try:
        password_hash = hashlib.sha256(flask.request.form["password"]).digest()
        db.register_user(flask.request.form["username"], password_hash)
    except KeyError:
        return "Both username and password must be present", HTTP_BAD_REQUEST
    except database.AuthenticationError:
        return "Username already exists", HTTP_BAD_REQUEST
    
    return "", HTTP_OK_EMPTY


# TODO: encrypt the messages using jwt