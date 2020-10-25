from flask_app import app, auth
import jwt
import flask
import collections
import models
import config
import hashlib
import random
import string
import datetime

HTTP_UNAUTHORIZED = 401
HTTP_BAD_REQUEST = 400
HTTP_CONFLICT = 409
HTTP_OK_EMPTY = 204


@auth.verify_token
def verify(token: str):
    try:
        payload = jwt.decode(token.encode(), app.config["SECRET"],
                             options={"require": ["exp", "iat", "user"]})
        return payload["user"]
    except Exception as e:
        print(e)
        return None


@app.route("/logins", methods=["POST", "GET"])
@auth.login_required
def logins():
    if flask.request.method == "POST":
        arguments = collections.defaultdict(lambda: None,  flask.request.form)

        if "id" in flask.request.form:
            try:
                models.Credential.update(auth.current_user(), arguments["id"], arguments["username"], arguments["domain"], arguments["password"],
                                         arguments["iv"])
            except RuntimeError as e:
                return flask.abort(HTTP_BAD_REQUEST, description=str(e))
        else:
            models.Credential.create(auth.current_user(), arguments["password"], arguments["iv"],
                                     arguments["username"], arguments["domain"])

        return "", HTTP_OK_EMPTY
    else:
        arguments = collections.defaultdict(lambda: None, flask.request.args)
        credentials = models.Credential.search(
            auth.current_user(), arguments["username"], arguments["domain"])
        return flask.jsonify([credential.to_dict() for credential in credentials])


@app.route("/register", methods=["POST"])
def register():
    try:
        models.User.create(flask.request.form["username"], hash_password(
            flask.request.form["username"], flask.request.form["password"]), flask.request.form["email"])
    except KeyError:
        return flask.abort(HTTP_BAD_REQUEST, description="all fields are required  are required")
    except models.AuthenticationError as e:
        return flask.abort(HTTP_BAD_REQUEST, description=str(e))
    return "", HTTP_OK_EMPTY


@app.route("/login", methods=["POST"])
def login():
    owner = None
    try:
        owner = models.User.validate(flask.request.form["username"], hash_password(
            flask.request.form["username"], flask.request.form["password"]))
    except KeyError:
        return flask.abort(HTTP_BAD_REQUEST, description="Username and password are required")
    except models.AuthenticationError as e:
        return flask.abort(HTTP_CONFLICT, str(e))

    return jwt.encode({
        "user": owner,
        "exp": datetime.datetime.utcnow() + config.jwt_duration(),
        "iat": datetime.datetime.utcnow()
    }, app.config["SECRET"], "HS256").decode()


def hash_password(username: str, password: str) -> bytes:
    seed = sum(hashlib.sha256(username.encode()).digest())
    salt = "".join(random.Random(seed).choices(
        string.ascii_letters + string.digits, k=32))
    return hashlib.sha512((password + salt).encode()).digest()
