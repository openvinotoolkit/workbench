"""
 OpenVINO DL Workbench
 Classes and functions creating and working with instance of SQLAlchemy

 Copyright (c) 2018 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker, Session
from sqlalchemy.pool import NullPool

from wb.config.application import get_config


def get_db_for_app() -> SQLAlchemy:
    return get_db_for_app.DB


get_db_for_app.DB = SQLAlchemy()


def get_db_session_for_app() -> Session:
    return get_db_for_app().session


def init_db_app(app: Flask):
    database = get_db_for_app()
    with app.app_context():
        database.init_app(app)


def get_db_for_celery() -> scoped_session:
    app_config = get_config()
    db_engine = create_engine(app_config.SQLALCHEMY_DATABASE_URI, poolclass=NullPool)
    return scoped_session(sessionmaker(autocommit=False, bind=db_engine))


def get_db_session_for_celery() -> Session:
    return get_db_for_celery()()
