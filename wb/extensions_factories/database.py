"""
 OpenVINO DL Workbench
 Classes and functions creating and working with instance of SQLAlchemy

 Copyright (c) 2018 Intel Corporation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
      http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
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
