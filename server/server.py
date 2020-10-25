import flask_app
import routes
import config
import argparse
import sys


def main(args):
    if args.init:
        flask_app.db.drop_all()
        flask_app.db.create_all()

    # in order to generate a self signed certificate (for the scope of this project it is good enough) you can run
    # openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365
    flask_app.app.run(ssl_context=(config.certificate_path(),
                                   config.certificate_key_path()), port=config.port())


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--init", action="store_true")
    args = parser.parse_args(sys.argv[1:])

    main(args)
