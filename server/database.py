import dataclasses
from typing import Dict, List
import mysql.connector
import itertools
import hashlib
import secrets

class AuthenticationError(Exception):
    def __init__(self, msg):
        super().__init__(msg)


@dataclasses.dataclass
class LoginCradential:
    domain: str
    password: bytes
    username: str
    _id: int

    def to_json(self):
        return {
            "domain": self.domain,
            "password": self.password,
            "username": self.username
        }


class Database:
    def __init__(self, username, password, host: str = "localhost", port: int = 3306, database: str = "password_manager"):
        self.db: mysql.connector.MySQLConnection = None
        try:
            self.db = mysql.connector.connect(
                host=host, port=port, user=username, password=password, database=database)
        except mysql.connector.errors.InterfaceError:
            raise ConnectionRefusedError(
                "Connection to database refused ({}:{})".format(host, port))

        self.cursor = self.db.cursor()
        self.__create_tables()

    def __create_tables(self):
        self.cursor.execute(r"""CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            username VARCHAR(100) NOT NULL UNIQUE,
            password BLOB NOT NULL
        );""")

        self.cursor.execute(r"""CREATE TABLE IF NOT EXISTS logins (
            id INT PRIMARY KEY AUTO_INCREMENT,
            domain TEXT,
            username TEXT,
            password BLOB NOT NULL,
            owner_id INT NOT NULL,
            FOREIGN KEY (owner_id) REFERENCES users(id)
        );""")

        self.db.commit()

    def add_login(self, owner_id: int, password: bytes, username: str = None, domain: str = None):
        self.cursor.execute(r"INSERT INTO logins (domain, username, password, owner_id) VALUES (%s, %s, %s, %s)",
                            (domain, username, password, owner_id))
        self.db.commit()

    def get_logins(self, owner_id: int, username: str = None, domain: str = None) -> List[LoginCradential]:
        """
        returns the logins that match the username and the domain.
        if no username and domain are given all logins will be returned
        """
        sql = r"SELECT domain, password, username, id FROM logins WHERE owner_id = %s"
        values = (owner_id, )

        if username:
            sql += r" AND username = %s"
            values = (*values, username)

        if domain:
            sql += r" AND domain = %s"
            values = (*values, domain)

        self.cursor.execute(sql, values)

        return [LoginCradential(*row) for row in self.cursor.fetchall()]

    def register_user(self, username: str, password: bytes) -> bool:
        """
        register a user and returns their id.
        throws an exception if registration fails
        """
        try:
            self.cursor.execute(
                r"INSERT INTO users (username, password) VALUES (%s, %s)", (username, password))
            self.db.commit()
        except Exception:
            raise AuthenticationError("username already exists")

        self.cursor.execute(
            r"SELECT id FROM users WHERE username=%s", (username,))

    def validate_password(self, username: str, password: bytes) -> int:
        self.cursor.execute(
            r"SELECT password, id FROM users WHERE username=%s", (username, ))
        if self.cursor.rowcount == 0:
            raise AuthenticationError("invalid username or password")

        db_password, user_id = self.cursor.fetchone()

        if not secrets.compare_digest(password, db_password):
            raise AuthenticationError("invalid username or password")

        return user_id
