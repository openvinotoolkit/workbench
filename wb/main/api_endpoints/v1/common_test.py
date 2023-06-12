"""
Tests for common endpoints
"""

# pylint: disable=no-name-in-module
# pylint: disable=wrong-import-position
from flask_migrate import upgrade

from migrations.migration import APP
from wb import CLIToolsOptionsCache
from wb.main.database import data_initialization

from wb.extensions_factories.database import get_db_session_for_app
from wb.main.api_endpoints.utils import find_projects, project_json, connect_with_parents
from wb.main.enumerates import OptimizationTypesEnum, SupportedFrameworksEnum, TargetTypeEnum
from wb.main.models.datasets_model import DatasetsModel
from wb.main.models.devices_model import DevicesModel
from wb.main.models.projects_model import ProjectsModel
from wb.main.models.target_model import TargetModel
from wb.main.models.topologies_metadata_model import TopologiesMetaDataModel
from wb.main.models.topologies_model import TopologiesModel


def apply_migrations():
    with APP.app_context():
        upgrade()


class TestFlaskAppCase:
    @staticmethod
    def setup():
        apply_migrations()
        data_initialization.initialize(APP)
        CLIToolsOptionsCache().initialize()


class TestCommonApiCase(TestFlaskAppCase):
    @staticmethod
    def create_topology_record() -> TopologiesModel:
        test_name = 'test_model'
        precisions = '{"inputs": ["FP32"], "body": ["FP32"], "outputs": ["FP32"]}'
        framework = SupportedFrameworksEnum.openvino
        metadata = TopologiesMetaDataModel()
        metadata.write_record(get_db_session_for_app())
        model = TopologiesModel(test_name, framework, metadata.id)
        model.precisions = precisions
        return model

    @staticmethod
    def create_dataset_record() -> DatasetsModel:
        test_name = 'test_dataset'
        return DatasetsModel(test_name)

    @staticmethod
    def create_device_record() -> DevicesModel:
        test_name = 'CPU'
        target = TargetModel.query.filter_by(target_type=TargetTypeEnum.local).first()
        return DevicesModel(target_id=target.id,
                            device_type=test_name, product_name=test_name, device_name=test_name,
                            optimization_capabilities=(), range_infer_requests={}, range_streams=None)

    @staticmethod
    def create_test_project(parent_model_id: int = None, dataset_id: int = None, device_id: int = None) -> int:
        model = TestCommonApiCase.create_topology_record()
        if parent_model_id:
            model.optimized_from = parent_model_id
        session = get_db_session_for_app()
        model.write_record(session)
        if not dataset_id:
            dataset = TestCommonApiCase.create_dataset_record()
            dataset.write_record(session)
            dataset_id = dataset.id
        if not device_id:
            device = TestCommonApiCase.create_device_record()
            device.write_record(session)
            device_id = device.id
        target = TargetModel.query.filter_by(target_type=TargetTypeEnum.local).first()
        return ProjectsModel.find_or_create_project(model_id=model.id,
                                                    dataset_id=dataset_id,
                                                    target_id=target.id,
                                                    device_id=device_id,
                                                    job_type=OptimizationTypesEnum.inference,
                                                    session=session)

    def test_find_second_line_projects(self):
        with APP.app_context():
            parent_project_id = self.create_test_project()
            parent_project = ProjectsModel.query.get(parent_project_id)
            child_project_id = self.create_test_project(parent_project.model_id, parent_project.dataset_id,
                                                        parent_project.device_id)
            projects = find_projects(parent_project.model_id, True)
            projects_json = tuple(map(project_json, projects))
            connect_with_parents(projects_json)
            child_project_json = tuple(filter(lambda p: p['parentId'] is not None, projects_json))
            assert len(child_project_json) == 1  # nosec: assert_used
            child_project_json = child_project_json[0]
            assert child_project_id == child_project_json['id']  # nosec: assert_used

    def test_find_third_line_projects(self):
        with APP.app_context():
            parent_project_id = self.create_test_project()
            parent_project = ProjectsModel.query.get(parent_project_id)
            first_child_project_id = self.create_test_project(parent_project.model_id, parent_project.dataset_id,
                                                              parent_project.device_id)
            first_parent_project = ProjectsModel.query.get(first_child_project_id)
            self.create_test_project(first_parent_project.model_id, parent_project.dataset_id,
                                     parent_project.device_id)
            projects = find_projects(parent_project.model_id, True)
            projects_json = tuple(map(project_json, projects))
            connect_with_parents(projects_json)
            child_project_json = tuple(filter(lambda p: p['parentId'] is not None, projects_json))
            parent_project_json = tuple(filter(lambda p: p['parentId'] is None, projects_json))
            projects_ids = set(map(lambda p: p.id, projects))
            assert len(parent_project_json) == 1  # nosec: assert_used
            assert len(child_project_json) == 2  # nosec: assert_used
            self.check_derivative_projects(parent_project_json[0], projects_ids, projects_json)

    @staticmethod
    def get_child_project_json_by_parent(project_id, projects_json):
        # Each project in projects_json must have only one child
        child = tuple(filter(lambda p: p['parentId'] == project_id, projects_json))
        assert len(child) <= 1  # nosec: assert_used
        return child[0] if child else None

    def check_derivative_projects(self, parent_project_json: dict, projects_ids: set, projects_json: tuple):
        assert parent_project_json['id'] in projects_ids # nosec: assert_used
        child_project_json = self.get_child_project_json_by_parent(parent_project_json['id'], projects_json)
        projects_ids.remove(parent_project_json['id'])
        if child_project_json:
            self.check_derivative_projects(child_project_json, projects_ids, projects_json)
            return
        assert not projects_ids  # nosec: assert_used
