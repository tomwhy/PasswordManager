import flask
import database
import json
import random
import os
import collections
import hashlib
import flask_httpauth
import sys
from flask_app import app

CONFIG_PATH = "config.json"

HTTP_UNAUTHORIZED = 401
HTTP_BAD_REQUEST = 400
HTTP_OK_EMPTY = 204

# create a server side session so the challenge wont be captured
with open(CONFIG_PATH) as config_file:
    mysql_config = json.load(config_file)["mysql"]
    try:
        db = database.Database(
            mysql_config["username"], mysql_config["password"], mysql_config["host"], mysql_config["port"])
    except ConnectionRefusedError:
        print("Could not connected to database", file=sys.stderr)
        exit(1)


@app.route('/set/')
def set():
    flask.session['key'] = 'value'
    return 'ok'


@app.route('/get/')
def get():
    return flask.session.get('key', 'not set')


@app.route("/password", methods=["POST"])
def add_password():
    """
    adds a password to the database.
    the password would be added to the logged user
    """
    if "owner" not in flask.session:
        return "You are not authenticated", HTTP_UNAUTHORIZED

    arguments = collections.defaultdict(lambda: None,  flask.request.form)
    db.add_login(flask.session["owner"], arguments["password"],  # TODO: encrypt password using the owner's hashed password
                 arguments["username"], arguments["domain"])
    return "", HTTP_OK_EMPTY


@app.route("/password", methods=["GET"])
def get_password():
    if "owner" not in flask.session:
        return "You are not authenticated", HTTP_UNAUTHORIZED

    arguments = collections.defaultdict(lambda: None, flask.request.args)
    cradentials = db.get_logins(
        flask.session["owner"], arguments["username"], arguments["domain"])
    # TODO: decrypt the password
    return flask.jsonify([cradential.to_json() for cradential in cradentials])


@app.route("/register", methods=["POST"])
def register():
    pass


def add_user_to_session(user_id):
    pass  # TODO: incoporate JWT into the session


if __name__ == "__main__":
    # in order to generate a self signed certificate (for the scope of this project is good enough) you can run
    # openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem
    app.run(ssl_context=("cert.pem", "key.pem"))
