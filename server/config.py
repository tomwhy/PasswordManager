import os
from typing import Union
import datetime


def sql_uri() -> Union[str, None]:
    return os.getenv("PASS_MNG_SQL_URI")


def sql_user() -> Union[str, None]:
    return os.getenv("PASS_MNG_SQL_USER")


def sql_pass() -> Union[str, None]:
    return os.getenv("PASS_MNG_SQL_PASS")


def port() -> Union[int, None]:
    if (port := os.getenv("PASS_MNG_API_PORT")) is not None and port.isnumeric():
        return int(port)
    else:
        return None


def certificate_path() -> Union[str, None]:
    return os.getenv("PASS_MNG_CERT")


def certificate_key_path() -> Union[str, None]:
    return os.getenv("PASS_MNG_CERT_KEY")


def secret() -> Union[str, None]:
    return os.getenv("PASS_MNG_SECRET")


def jwt_duration() -> Union[datetime.timedelta, None]:
    if (duration := os.getenv("PASS_MNG_JWT_DURATION")) is not None and duration.isnumeric():
        return datetime.timedelta(minutes=int(duration))
    else:
        return datetime.timedelta(hours=1)  # a default of 1 hour duration
