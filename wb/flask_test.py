"""
Common test class for testing flask application
"""

from flask_migrate import upgrade

from migrations.migration import APP as MIGRATION_APP
from wb import CLIToolsOptionsCache
from wb.main.database import data_initialization


def apply_migrations():
    with MIGRATION_APP.app_context():
        upgrade()


apply_migrations()

# before to import main workbench app we need to set up database schema by applying migrations
# main workbench app expects updated schema
# this import is required for app/main/api_endpoints/v1/common_test.py, without it test fails because of registering
# duplicated endpoints
# pylint: disable=no-name-in-module
# pylint: disable=wrong-import-position
from workbench.workbench import APP


class TestFlaskAppCase:
    @staticmethod
    def setup():
        apply_migrations()
        data_initialization.initialize(APP)
        CLIToolsOptionsCache().initialize()
