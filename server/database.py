import dataclasses
from typing import Dict, List
import mysql.connector
import itertools


class AuthenticationError(Exception):
    pass


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
        self.db = mysql.connector.connect(
            host=host, port=port, user=username, password=password, database=database)

        self.cursor = self.db.cursor()
        self.__create_tables()

    def __create_tables(self):
        self.cursor.execute(r"""CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            username VARCHAR(100) NOT NULL UNIQUE,
            password BLOB NOT NULL,
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

    def __del__(self):
        self.db.close()

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

    def register_user(self, username: str, password: bytes) -> int:
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
        return self.cursor.fetchone()[0]

    def compere_passwords(self, username: str, password: bytes) -> bool:
        self.cursor.execute(
            r"SELECT password, id FROM users WHERE username=%s", (username, ))
        db_password, user_id = self.cursor.fetchone()

        password_match = True
        for pass_char, db_char in zip(password, db_password):
            password_match = password_match and pass_char == db_char

        if not password_match:
            raise AuthenticationError("Username or password are inccorect")

        return user_id
