import dataclasses
from typing import Dict, List, Tuple, Callable
import sqlite3
import itertools
import hashlib
import secrets
import threading
import queue


class AuthenticationError(Exception):
    def __init__(self, msg):
        super().__init__(msg)


@dataclasses.dataclass
class LoginCredential:
    domain: str
    password: str
    username: str
    iv: str
    _id: int

    def to_json(self):
        return {
            "domain": self.domain,
            "password": self.password,
            "username": self.username,
            "iv": self.iv,
            "id": self._id
        }


class Database:
    def __init__(self, database):
        self.work = queue.Queue()
        self.worker_thread = threading.Thread(
            target=self.worker, args=(database,))
        self.worker_thread.start()

    def __create_tables(self):
        self.cursor.execute("PRAGMA foreign_keys = 1;")

        self.cursor.execute(r"""CREATE TABLE IF NOT EXISTS users (
            id INTEGER NOT NULL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password BLOB NOT NULL
        );""")

        self.cursor.execute(r"""CREATE TABLE IF NOT EXISTS logins (
            id INTEGER NOT NULL PRIMARY KEY,
            domain TEXT,
            username TEXT,
            password TEXT NOT NULL,
            iv TEXT NOT NULL,
            owner_id INTEGER NOT NULL,
            FOREIGN KEY (owner_id) REFERENCES users(id)
        );""")

        self.db.commit()

    def worker(self, database):
        self.db = sqlite3.connect(database)
        self.cursor = self.db.cursor()
        self.__create_tables()

        while True:
            task = self.work.get()
            try:
                res = task[0](*task[1])
                task[2].put(res)
            except Exception as e:
                task[2].put(e)

    def _run_work(self, work, *args):
        q = queue.Queue()
        self.work.put((work, args, q))
        res = q.get()
        if isinstance(res, Exception):
            raise res
        else:
            return res

    def _add_login(self, owner_id: int, password: str, iv: str, username: str = None, domain: str = None):
        self.cursor.execute(r"INSERT INTO logins (domain, username, password, owner_id, iv) VALUES (?, ?, ?, ?, ?)",
                            (domain or "", username or "", password, owner_id, iv))
        self.db.commit()

    def add_login(self, owner_id: int, password: str, iv: str, username: str = None, domain: str = None):
        return self._run_work(self._add_login, owner_id, password, iv, username, domain)

    def _change_login(self, owner_id: int, pass_id: int, new_username: str = None, new_password: str = None, new_iv: str = None, new_domain: str = None) -> bool:
        self.cursor.execute(
            "SELECT COUNT(*) FROM logins WHERE id=? and owner_id=?", (pass_id, owner_id))
        if self.cursor.fetchall()[0][0] == 0:
            raise RuntimeError("Invalid Login ID")

        values = ()
        set_caluse = "SET"

        if new_username is not None:
            set_caluse += r" username=?,"
            values = (*values, new_username)

        if new_password is not None:
            set_caluse += r" password=?,"
            values = (*values, new_password)

        if new_iv is not None:
            set_caluse += r" iv=?,"
            values = (*values, new_iv)

        if new_domain is not None:
            set_caluse += r" domain=?,"
            values = (*values, new_domain)

        if set_caluse != "SET":  # only if there is at least on change
            set_caluse = set_caluse[:-1]  # delete the last ,
            sql = r"UPDATE logins {} WHERE owner_id = ? and id = ?;".format(
                set_caluse)
            values = (*values, owner_id, pass_id)

            self.cursor.execute(sql, values)
            self.db.commit()
            return True

        return False

    def change_login(self, owner_id: int, pass_id: int, new_username: str = None, new_password: str = None, new_iv: str = None, new_domain: str = None):
        return self._run_work(self._change_login, owner_id, pass_id, new_username, new_password, new_iv, new_domain)

    def _get_logins(self, owner_id: int, username: str = None, domain: str = None) -> List[LoginCredential]:
        """
        returns the logins that match the username and the domain.
        if no username and domain are given all logins will be returned
        """
        sql = r"SELECT domain, password, username, iv, id FROM logins WHERE owner_id = ?"
        values = (owner_id, )

        if username:
            sql += r" AND username = ?"
            values = (*values, username)

        if domain:
            sql += r" AND domain = ?"
            values = (*values, domain)

        self.cursor.execute(sql, values)

        return [LoginCredential(*row) for row in self.cursor.fetchall()]

    def get_logins(self, owner_id: int, username: str = None, domain: str = None):
        return self._run_work(self._get_logins, owner_id, username, domain)

    def _register_user(self, username: str, password: bytes):
        """
        register a user and returns their id.
        throws an exception if registration fails
        """
        try:
            self.cursor.execute(
                r"INSERT INTO users (username, password) VALUES (?, ?)", (username, password))
            self.db.commit()
        except Exception as e:
            raise AuthenticationError("username already exists")

    def register_user(self, username: str, password: bytes):
        return self._run_work(self._register_user, username, password)

    def _validate_password(self, username: str, password: bytes) -> int:
        self.cursor.execute(
            r"SELECT password, id FROM users WHERE username=?", (username, ))

        row = self.cursor.fetchall()

        if not row:
            raise AuthenticationError("invalid username or password")

        db_password, user_id = row[0]

        if not secrets.compare_digest(password, db_password):
            raise AuthenticationError("invalid username or password")

        return user_id

    def validate_password(self, username: str, password: bytes):
        return self._run_work(self._validate_password, username, password)
