import flask
import flask_cors
import flask_httpauth
import os
import config
import flask_sqlalchemy
import base64

app = flask.Flask(__name__)
app.config["SECRET"] = config.secret() or base64.encodebytes(os.urandom(64)).decode()
app.config["SQLALCHEMY_DATABASE_URI"] = config.sql_uri()
flask_cors.CORS(app, supports_credentials=True)
auth = flask_httpauth.HTTPTokenAuth()
db = flask_sqlalchemy.SQLAlchemy(app)
