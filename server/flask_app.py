import flask
import flask_session
import os
import datetime


SECRET_LENGTH = 32
SECRET_KEY = os.urandom(SECRET_LENGTH)
# set the session to store on the filesystem
SESSION_TYPE = "filesystem"
# set the session to http and https
SESSION_COOKIE_HTTPONLY = False
SESSION_COOKIE_SECURE = True  # set the session to be secured
PERMANENT_SESSION_LIFETIME = datetime.timedelta(minutes=1)


app = flask.Flask(__name__)
app.config["secret_key"] = os.urandom(SECRET_LENGTH)
app.config.from_object(__name__)
flask_session.Session(app)

