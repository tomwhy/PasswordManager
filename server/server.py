import flask
import database
import json

CONFIG_PATH = "config.json"

app = flask.Flask(__name__)
with open(CONFIG_PATH) as config_file:
    mysql_config = json.load(config_file)["mysql"]
    database_client = database.Database(mysql_config["username"], mysql_config["password"], mysql_config["host"], mysql_config["port"])

