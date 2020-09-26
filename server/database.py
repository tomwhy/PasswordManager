import dataclasses
from typing import Dict, List
import mysql.connector
import itertools


@dataclasses.dataclass
class LoginCradential:
    domain: str
    password: bytes
    username: str
    _id: int


class Database:
    def __init__(self, username, password, host: str = "localhost", port: int = 3306, database: str = "password_manager"):
        """
        database is expected to be with the following tables:
        logins (
            id INT AUTO_INCREAMENT,
            domain TEXT NOT NULL,
            username TEXT,
            password BLOB NOT NULL,
            owner_id INT NOT NULL,
            PRIMARY KEY (id),
            FOREIGN KEY (owner_id) REFERENCES users(id)
        )

        users (
            id INT AUTO_INCREAMENT,
            username TEXT NOT NULL UNIQUE,
            password BLOB NOT NULL,
            PRIMARY KEY (id)
        )

        """

        self.db = mysql.connector.connect(
            host=host, port=port, user=username, password=password, database=database)

        self.cursor = self.db.cursor()

    def __del__(self):
        self.db.close()

    def add_login(self, owner_id: int, domain: str, password: bytes, username: str = None):
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

    def register_user(self, username: str, password: bytes):
        self.cursor.execute(
            r"INSERT INTO users (username, password) VALUES (%s, %s)", (username, password))
        self.db.commit()

    def compere_passwords(self, username: str, password: bytes) -> bool:
        self.cursor.execute(
            r"SELECT password FROM users WHERE username=%s", (username, ))
        db_password = self.cursor.fetchone()[0]

        password_match = True
        for pass_char, db_char in zip(password, db_password):
            password_match = password_match and pass_char == db_char

        return password_match
