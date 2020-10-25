from flask_app import db
import secrets


class AuthenticationError(Exception):
    def __init__(self, msg):
        super().__init__(msg)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    # TODO: send email notifications (NOT MVP)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.LargeBinary, nullable=False)
    credentials = db.relationship("Credential", backref="user", lazy=True)

    @staticmethod
    def create(username: str, password: bytes, email: str):
        user = User(username=username, password=password, email=email)
        db.session.add(user)
        db.session.commit()

    @staticmethod
    def validate(username, password) -> int:
        user: User = User.query.filter_by(username=username).first()
        if user and secrets.compare_digest(user.password, password):
            return user.id
        else:
            raise AuthenticationError("Incorrect username or password")


class Credential(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    domain = db.Column(db.Text)
    username = db.Column(db.TEXT)
    password = db.Column(db.TEXT, nullable=False)
    iv = db.Column(db.Text, nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    @staticmethod
    def create(owner: int, password: str, iv: str, username: str = None, domain: str = None):
        if Credential.query.filter_by(username=username, domain=domain, owner_id=owner).all():
            raise RuntimeError(
                "There is already a password for this domain and username")

        login = Credential(domain=domain, username=username,
                           password=password, iv=iv, owner_id=owner)

        login.checkValid()

        db.session.add(login)
        db.session.commit()

    def checkValid(self):
        # only if both username and domain where specified check if the entry already exists
        # in other words skip this check if the entry is incomplete
        # check if there is more than 1 entry with the same username and domain
        if self.username and self.domain and len(Credential.query.filter_by(username=self.username, domain=self.domain, owner_id=self.owner_id).all()) > 1:
            raise RuntimeError("Entry already exists")
        elif len(self.password) == 0:
            raise RuntimeError("Password cannot be empty")
        elif len(self.iv) == 0:
            raise RuntimeError("IV cannot be empty")

    def to_dict(self):
        return {
            "username": self.username,
            "password": self.password,
            "iv": self.iv,
            "id": self.id,
            "domain": self.domain
        }

    @staticmethod
    def update(owner: int, pass_id: int, username: str = None, domain: str = None, password: str = None, iv: str = None):
        credential: Credential = Credential.query.filter_by(
            id=pass_id, owner_id=owner).first()

        if username is not None:
            credential.username = username

        if domain is not None:
            credential.domain = domain

        if password is not None:
            credential.password = password
            if iv is not None:
                credential.iv = iv

        credential.checkValid()

        db.session.commit()

    @staticmethod
    def search(owner: int, username: str = None, domain: str = None) -> list:
        res = Credential.query.filter_by(owner_id=owner)

        if username:
            res = res.filter_by(username=username)

        if domain:
            res = res.filter_by(domain=domain)

        return res.all()
