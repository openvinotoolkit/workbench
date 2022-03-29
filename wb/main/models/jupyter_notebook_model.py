"""
 OpenVINO DL Workbench
 Class for ORM model described Jupyter notebook abstraction

 Copyright (c) 2021 Intel Corporation

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
import os
from contextlib import closing
from pathlib import Path
from typing import Dict, Optional, Any

from sqlalchemy import Column, String, Integer, ForeignKey, event
from sqlalchemy.engine import Connection
from sqlalchemy.orm import relationship, backref, Mapper, Session, sessionmaker

from config.constants import JUPYTER_NOTEBOOKS_FOLDER, ESSENTIAL_DATA_FOLDER
from wb.main.console_tool_wrapper.model_optimizer.tool import ModelOptimizerTool
from wb.main.enumerates import ModelPrecisionEnum, JobTypesEnum, StatusEnum, OptimizationTypesEnum, ModelDomainEnum, \
    ModelShapeTypeEnum
from wb.main.jupyter_notebooks.cell_template_contexts import IntroCellTemplateContext, \
    SetIRModelPathsCodeCellTemplateContext, ProfilingCodeCellTemplateContext, AccuracyDocsCellTemplateContext, \
    AccuracyCodeCellTemplateContext, Int8OptimizationCodeCellTemplateContext, Int8OptimizationDocsCellTemplateContext, \
    ObtainModelDocsCellTemplateContext, ModelDownloaderCodeCellTemplateContext, \
    CheckModelFormatDocsCellTemplateContext, ModelConverterCodeCellTemplateContext, \
    ModelOptimizerCodeCellTemplateContext, InstallRequirementsCodeCellTemplateContext, \
    TokenizerParametersTemplateContext, TransformersONNXCodeCellTemplateContext
from wb.main.jupyter_notebooks.cli_tools_options import CLIToolEnum
from wb.main.jupyter_notebooks.config_file_dumpers import AccuracyConfigFileDumper, Int8OptimizationConfigFileDumper
from wb.main.jupyter_notebooks.jupyter_notebook_cell import NotebookCellIds
from wb.main.jupyter_notebooks.jupyter_notebook_dumper import JupyterNotebookDumper
from wb.main.jupyter_notebooks.notebook_template_creator import NotebookTemplateCreator
from wb.main.models.base_model import BaseModel
from wb.main.models.model_optimizer_job_model import ModelOptimizerJobModel


class JupyterNotebookModel(BaseModel):
    __tablename__ = 'jupyter_notebooks'

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=True)
    name = Column(String, nullable=False)

    # Relationships
    project: 'ProjectsModel' = relationship('ProjectsModel',
                                            backref=backref('jupyter_notebook', cascade='delete,all', uselist=False),
                                            foreign_keys=[project_id])

    def __init__(self, project_id: int):
        self.project_id = project_id
        self.name = f'project_{self.project_id}.ipynb'

    @property
    def notebook_directory_path(self) -> str:
        return str(Path(JUPYTER_NOTEBOOKS_FOLDER).resolve().absolute() / str(self.id))

    @property
    def notebook_path(self) -> str:
        return os.path.join(self.notebook_directory_path, self.name)

    @property
    def notebook_relative_path(self) -> str:
        return os.path.relpath(path=self.notebook_path, start=ESSENTIAL_DATA_FOLDER)

    @property
    def notebook_exists(self) -> bool:
        return os.path.isfile(self.notebook_path)

    @staticmethod
    def get_jupyter_notebook_model(project_id: int, session: Session) -> 'JupyterNotebookModel':
        jupyter_notebook_model: JupyterNotebookModel = session.query(JupyterNotebookModel).filter(
            JupyterNotebookModel.project_id == project_id
        ).first()
        if not jupyter_notebook_model:
            raise Exception(f'Jupyter notebook model not found for project id {project_id}')
        if not os.path.isfile(jupyter_notebook_model.notebook_path):
            raise Exception(f'Jupyter notebook file not found in path {jupyter_notebook_model.notebook_path}')
        return jupyter_notebook_model

    @property
    def jupyter_notebook_dumper(self) -> JupyterNotebookDumper:
        topology: 'TopologiesModel' = self.project.topology.optimized_from_record or self.project.topology
        is_nlp = topology.domain == ModelDomainEnum.NLP
        has_tokenizer = topology.tokenizer_model is not None
        notebook_template_creator = NotebookTemplateCreator(notebook_type=self.project.optimization_type,
                                                            original_model_source=topology.source,
                                                            original_model_framework=topology.original_model_framework,
                                                            is_nlp=is_nlp,
                                                            has_tokenizer=has_tokenizer,)
        return JupyterNotebookDumper(notebook_path=self.notebook_path,
                                     notebook_template_creator=notebook_template_creator)

    @property
    def initial_cells_context_map(self) -> Dict[NotebookCellIds, dict]:
        return {
            key: getter.__get__(self) for key, getter in self._cell_id_to_context_getter_map.items()
        }

    def _get_cell_template_context(self, cell_id: NotebookCellIds) -> dict:
        cell_context_getter = self._cell_id_to_context_getter_map.get(cell_id)
        if not cell_context_getter:
            raise Exception(f'No template context found for cell with id {cell_id}')
        return cell_context_getter.__get__(self)

    def update_cell_by_job_type(self, job_type: JobTypesEnum):
        cell_ids_to_update = self._job_type_to_update_cell_ids_map.get(job_type)
        if not cell_ids_to_update:
            raise Exception(f'No Jupyter notebook cell found to update for job with type {job_type}')
        notebook_dumper = self.jupyter_notebook_dumper

        cell_ids_to_update = [cell for cell in cell_ids_to_update if cell in notebook_dumper]
        for cell_id_to_update in cell_ids_to_update:
            cell_template_context = self._get_cell_template_context(cell_id=cell_id_to_update)
            notebook_dumper.update_cell(cell_id=cell_id_to_update,
                                        cell_template_context=cell_template_context)
            # Update int8 optimization cell for parent project notebook
            if cell_id_to_update == NotebookCellIds.int8_optimization_code:
                current_session = Session.object_session(self)
                parent_project = self.project.get_parent_project(session=current_session)
                if not parent_project:
                    continue
                parent_project_notebook: JupyterNotebookModel = parent_project.jupyter_notebook
                if not parent_project_notebook or not parent_project_notebook.notebook_exists:
                    continue
                parent_project_notebook_dumper: JupyterNotebookDumper = parent_project_notebook.jupyter_notebook_dumper
                parent_project_notebook_dumper.update_cell(cell_id=cell_id_to_update,
                                                           cell_template_context=cell_template_context)

    def update_notebook_by_orm_event(self, model_class: BaseModel, orm_event: str):
        cell_ids_to_update = self._orm_event_to_update_cell_ids_map[model_class][orm_event]
        notebook_dumper = self.jupyter_notebook_dumper

        self.jupyter_notebook_dumper.update_notebook_cells()

        for cell_id_to_update in cell_ids_to_update:
            cell_template_context = self._get_cell_template_context(cell_id=cell_id_to_update)
            notebook_dumper.update_cell(
                cell_id=cell_id_to_update,
                cell_template_context=cell_template_context
            )

    @property
    def _original_project(self) -> 'ProjectsModel':
        current_session = Session.object_session(self)
        return self.project.get_parent_project(session=current_session) or self.project

    @property
    def _is_optimized_project(self) -> bool:
        return self.project.optimization_type == OptimizationTypesEnum.int8calibration

    @property
    def _has_accuracy_checker_section(self) -> bool:
        return NotebookCellIds.accuracy_code in self.jupyter_notebook_dumper

    @property
    def _has_int8_calibration_section(self) -> bool:
        return NotebookCellIds.int8_optimization_code in self.jupyter_notebook_dumper

    @property
    def _has_tokenizer_section(self) -> bool:
        return NotebookCellIds.load_tokenizer_code in self.jupyter_notebook_dumper

    @property
    def _intro_cell_template_context(self) -> IntroCellTemplateContext:
        original_project: 'ProjectsModel' = self._original_project
        topology: 'TopologiesModel' = original_project.topology
        topology_json: dict = topology.json()
        model_task_type = topology_json.get('accuracyConfiguration', {}).get('taskType')
        project_model_framework = topology.original_model_framework.value
        model_precisions = topology.get_precisions()
        mo_params = topology_json.get('analysis', {}).get('moParams', {})
        topology_analysis_precision = ModelPrecisionEnum.fp16.value
        if mo_params:
            topology_analysis_precision = mo_params['dataType']
        model_precisions = ', '.join(model_precisions) if model_precisions else topology_analysis_precision

        return IntroCellTemplateContext(
            is_optimized_project=self._is_optimized_project,
            project_model_name=topology.name,
            project_model_domain=topology.domain.value if topology.domain else "Generic",
            project_device_name=original_project.device.device_name,
            project_model_task_type=model_task_type,
            project_model_framework=project_model_framework,
            project_model_precisions=model_precisions,
            has_tokenizer_section=self._has_tokenizer_section,
            has_accuracy_checker_section=self._has_accuracy_checker_section,
            has_int8_calibration_section=self._has_int8_calibration_section,
        )

    @property
    def _python_executable(self) -> str:
        topology = self._original_project.topology
        python_executable = ''
        environment: 'EnvironmentModel' = topology.environment
        if environment:
            python_executable = environment.python_executable
        return str(python_executable)

    @property
    def _obtain_model_docs_cell_template_context(self) -> ObtainModelDocsCellTemplateContext:
        topology: 'TopologiesModel' = self._original_project.topology
        project_model_framework = topology.original_model_framework.value if topology.original_model_framework else None
        project_model_source = topology.source.value if topology.source else None
        return ObtainModelDocsCellTemplateContext(
            project_model_name=topology.name,
            project_model_framework=project_model_framework,
            project_model_source=project_model_source)

    @property
    def _model_downloader_code_cell_template_context(self) -> ModelDownloaderCodeCellTemplateContext:
        output_directory_path = 'downloaded_model'

        return ModelDownloaderCodeCellTemplateContext(
            omz_model_name=self.project.topology.name,
            output_directory_path=output_directory_path)

    @property
    def _model_converter_code_cell_template_context(self) -> ModelConverterCodeCellTemplateContext:
        model_downloader_cell_context = self._model_downloader_code_cell_template_context
        output_directory_path = 'ir_model'

        return ModelConverterCodeCellTemplateContext(
            omz_model_name=model_downloader_cell_context['omz_model_name'],
            download_directory_path=model_downloader_cell_context['output_directory_path'],
            output_directory_path=output_directory_path)

    def _add_layout_to_mo_args(self, mo_args: Dict[str, Any]) -> None:
        layout_from_mo_args = mo_args.get('layout')
        layout_from_topology = self.project.topology.meta.layout_configuration
        if not layout_from_mo_args and layout_from_topology:
            mo_args['layout'] = ','.join(
                f'{layer["name"]}({"".join(map(str.lower, layer["layout"]))})' for layer in layout_from_topology
            )

    def _add_shape_to_mo_args(self, mo_args: Dict[str, Any]) -> None:
        if 'input' in mo_args and 'input_shape' in mo_args:
            return

        static_shapes = [
            shape for shape in self.project.topology.shapes if shape.shape_type is ModelShapeTypeEnum.static
        ]

        if static_shapes:
            last_shape = static_shapes[-1]
            mo_args['input'] = ','.join(
                f'{input_["name"]}[{" ".join(map(str, input_["shape"]))}]'
                for input_ in last_shape.shape_configuration
            )

    @property
    def _model_optimizer_code_cell_template_context(self) -> ModelOptimizerCodeCellTemplateContext:
        output_directory_path = 'ir_model'
        mo_arguments = ''
        python_executable = ''

        mo_jobs = self._original_project.topology.mo_jobs_from_result
        if mo_jobs:
            ready_mo_jobs = [job for job in mo_jobs if job.status == StatusEnum.ready]
            if ready_mo_jobs:
                last_ready_mo_job: ModelOptimizerJobModel = sorted(ready_mo_jobs, key=lambda job: job.job_id)[-1]
                mo_args = last_ready_mo_job.get_mo_args_for_tool(output_directory_path=output_directory_path)
                mo_args.pop('stream_output', None)
                self._add_shape_to_mo_args(mo_args)
                self._add_layout_to_mo_args(mo_args)
                original_topology: 'TopologiesModel' = last_ready_mo_job.original_topology

                environment: 'EnvironmentModel' = original_topology.environment
                if environment:
                    python_executable = str(environment.python_executable)

                mo_tool = ModelOptimizerTool(python_executable, mo_args, original_topology.framework)
                mo_arguments = mo_tool.console_command_params
                python_executable += f" -m {mo_tool.exe}"
        return ModelOptimizerCodeCellTemplateContext(python_executor=python_executable,
                                                     mo_arguments=mo_arguments,
                                                     output_directory_path=output_directory_path)

    @property
    def _set_optimized_ir_model_paths_docs_cell_template_context(self) -> CheckModelFormatDocsCellTemplateContext:
        return CheckModelFormatDocsCellTemplateContext(is_optimized_project=self._is_optimized_project)

    @property
    def _set_original_ir_model_paths_code_cell_template_context(self) -> SetIRModelPathsCodeCellTemplateContext:
        original_model_xml_file_path, original_model_bin_file_path = self._original_project.topology.files_paths
        return SetIRModelPathsCodeCellTemplateContext(model_xml_file_path=original_model_xml_file_path,
                                                      model_bin_file_path=original_model_bin_file_path)

    @property
    def _set_optimized_ir_model_paths_code_cell_template_context(self) -> SetIRModelPathsCodeCellTemplateContext:
        optimized_model_xml_file_path, optimized_model_bin_file_path = self.project.topology.files_paths
        return SetIRModelPathsCodeCellTemplateContext(model_xml_file_path=optimized_model_xml_file_path,
                                                      model_bin_file_path=optimized_model_bin_file_path)

    @property
    def _profiling_code_cell_template_context(self) -> ProfilingCodeCellTemplateContext:
        model_xml_file_path, _ = self.project.topology.files_paths
        profiling_image_path = self.project.dataset.single_file_path
        profiling_device = self.project.device.device_name
        batch = 1
        streams = 1
        inference_time = 20
        last_profiling_job_model: Optional['ProfilingJobModel'] = self.project.last_compound_inference_job
        if last_profiling_job_model:
            last_profiling_result: 'SingleInferenceInfoModel' = last_profiling_job_model.profiling_results[-1]
            batch = last_profiling_result.batch
            streams = last_profiling_result.nireq
            inference_time = last_profiling_job_model.inference_time

        if self._has_tokenizer_section:
            profiling_image_path = self._get_input_file_mapping_for_profiling(batch, streams)

        return ProfilingCodeCellTemplateContext(
            python_executor=CLIToolEnum.benchmark_tool.value['path'],
            model_xml_path=model_xml_file_path,
            image_path=profiling_image_path,
            device=profiling_device,
            batch=batch,
            streams=streams,
            inference_time=inference_time,
            has_tokenizer_section=self._has_tokenizer_section or self.project.topology.domain is ModelDomainEnum.CV,
        )

    def _get_input_file_mapping_for_profiling(self, batch: int, streams: int) -> str:
        input_names = [input_['name'] for input_ in self.project.topology.meta.layout_configuration]
        number_of_samples = min(batch * streams, self.project.dataset.number_images)

        binary_dataset_path = Path('binary_dataset')
        file_mapping = {
            input_name: [str(binary_dataset_path / f'{input_name}_{idx:03d}.bin') for idx in range(number_of_samples)]
            for input_name in input_names
        }

        return ','.join(
                    f'{input_name}:' + ','.join(files) for input_name, files in file_mapping.items()
                )

    @property
    def _accuracy_docs_cell_template_context(self) -> AccuracyDocsCellTemplateContext:
        yaml_config_path = AccuracyConfigFileDumper.get_relative_config_file_path()
        return AccuracyDocsCellTemplateContext(yaml_config_path=str(yaml_config_path))

    @property
    def _accuracy_code_cell_template_context(self) -> AccuracyCodeCellTemplateContext:
        yaml_config_path = self._accuracy_docs_cell_template_context['yaml_config_path']
        model_xml_file_path, _ = self.project.topology.files_paths
        last_accuracy_job_model = self.project.get_last_job_by_type(job_type=JobTypesEnum.accuracy_type.value)
        json_config = last_accuracy_job_model.accuracy_config if last_accuracy_job_model else None
        model_directory_path = os.path.dirname(model_xml_file_path) if model_xml_file_path else None
        images_directory_path = os.path.dirname(
            self.project.dataset.single_file_path) if self.project.dataset.single_file_path else None
        return AccuracyCodeCellTemplateContext(yaml_config_path=str(yaml_config_path),
                                               json_config=json_config,
                                               model_directory_path=model_directory_path,
                                               images_directory_path=images_directory_path)

    @property
    def _int8_optimization_docs_cell_template_context(self) -> Int8OptimizationDocsCellTemplateContext:
        int8_optimization_config_path = Int8OptimizationConfigFileDumper.get_relative_config_file_path()
        return Int8OptimizationDocsCellTemplateContext(
            is_optimized_project=self._is_optimized_project,
            int8_optimization_config_path=str(int8_optimization_config_path))

    @property
    def _int8_optimization_code_cell_template_context(self) -> Int8OptimizationCodeCellTemplateContext:
        int8_optimization_config_path = self._int8_optimization_docs_cell_template_context[
            'int8_optimization_config_path']
        last_int8_job_model = self.project.get_last_job_by_type(job_type=JobTypesEnum.int8calibration_type.value)
        int8_optimization_config = ''
        if last_int8_job_model:
            int8_optimization_config = last_int8_job_model.int8_config_file_content
        output_directory_path = 'int8_optimization_result'
        return Int8OptimizationCodeCellTemplateContext(int8_optimization_config_path=str(int8_optimization_config_path),
                                                       int8_optimization_config=int8_optimization_config,
                                                       output_directory_path=output_directory_path)

    @property
    def _install_requirements_template_context(self) -> InstallRequirementsCodeCellTemplateContext:
        return InstallRequirementsCodeCellTemplateContext(
            requirements_file=(
                'requirements_nlp.txt' if self.project.topology.domain is ModelDomainEnum.NLP else 'requirements.txt'
            )
        )

    @property
    def _tokenizer_parameters_template_context(self) -> TokenizerParametersTemplateContext:
        batch = 1
        streams = 1
        last_profiling_job_model: Optional['ProfilingJobModel'] = self.project.last_compound_inference_job
        if last_profiling_job_model:
            last_profiling_result: 'SingleInferenceInfoModel' = last_profiling_job_model.profiling_results[-1]
            batch = last_profiling_result.batch
            streams = last_profiling_result.nireq

        tokenizer = self.project.topology.tokenizer_model
        tokenizer_path = tokenizer.path if tokenizer else None
        return TokenizerParametersTemplateContext(
            dataset_path=self.project.dataset.single_file_path,
            tokenizer_path=tokenizer_path,
            batch=batch,
            streams=streams,
        )

    @property
    def _transformers_onnx_template_context(self) -> TransformersONNXCodeCellTemplateContext:
        model_checkpoint = self.project.topology.name
        return TransformersONNXCodeCellTemplateContext(model_checkpoint=model_checkpoint)

    _job_type_to_update_cell_ids_map = {
        JobTypesEnum.profiling_type: [
            NotebookCellIds.intro_docs,
            NotebookCellIds.set_original_ir_model_paths_code,
            NotebookCellIds.tokenizer_parameters_code,
            NotebookCellIds.profiling_code,
            NotebookCellIds.accuracy_code,
        ],
        JobTypesEnum.accuracy_type: [
            NotebookCellIds.intro_docs,
            NotebookCellIds.accuracy_code,
        ],
        JobTypesEnum.int8calibration_type: [
            NotebookCellIds.int8_optimization_code,
            NotebookCellIds.set_optimized_ir_model_paths_code,
        ],
    }

    _orm_event_to_update_cell_ids_map = {
        'TokenizerToTopologyModel': {
            "after_update": [
                NotebookCellIds.intro_docs,
                NotebookCellIds.tokenizer_parameters_code,
                NotebookCellIds.profiling_code,
            ]
        },
        'TokenizerModel': {
            "after_delete": [
                NotebookCellIds.intro_docs,
                NotebookCellIds.profiling_code,
            ]
        },
    }

    _cell_id_to_context_getter_map = {
        NotebookCellIds.intro_docs: _intro_cell_template_context,
        NotebookCellIds.obtain_model_docs: _obtain_model_docs_cell_template_context,
        NotebookCellIds.model_downloader_code: _model_downloader_code_cell_template_context,
        NotebookCellIds.model_downloader_result_docs: _model_downloader_code_cell_template_context,
        NotebookCellIds.model_converter_code: _model_converter_code_cell_template_context,
        NotebookCellIds.model_converter_result_docs: _model_converter_code_cell_template_context,
        NotebookCellIds.model_optimizer_docs: _obtain_model_docs_cell_template_context,
        NotebookCellIds.model_optimizer_code: _model_optimizer_code_cell_template_context,
        NotebookCellIds.model_optimizer_result_docs: _model_optimizer_code_cell_template_context,
        NotebookCellIds.set_original_ir_model_paths_code: _set_original_ir_model_paths_code_cell_template_context,
        NotebookCellIds.set_optimized_ir_model_paths_docs: _set_optimized_ir_model_paths_docs_cell_template_context,
        NotebookCellIds.set_optimized_ir_model_paths_code: _set_optimized_ir_model_paths_code_cell_template_context,
        NotebookCellIds.profiling_code: _profiling_code_cell_template_context,
        NotebookCellIds.accuracy_docs: _accuracy_docs_cell_template_context,
        NotebookCellIds.check_accuracy_config_code: _accuracy_docs_cell_template_context,
        NotebookCellIds.accuracy_code: _accuracy_code_cell_template_context,
        NotebookCellIds.int8_optimization_docs: _int8_optimization_docs_cell_template_context,
        NotebookCellIds.check_int8_optimization_config_code: _int8_optimization_docs_cell_template_context,
        NotebookCellIds.int8_optimization_code: _int8_optimization_code_cell_template_context,
        NotebookCellIds.int8_optimization_result_docs: _int8_optimization_code_cell_template_context,
        NotebookCellIds.tokenizer_parameters_code: _tokenizer_parameters_template_context,
        NotebookCellIds.install_python_requirements_code: _install_requirements_template_context,
        NotebookCellIds.transformers_onnx_converter_code: _transformers_onnx_template_context
    }


@event.listens_for(JupyterNotebookModel, 'after_insert', propagate=True)
def create_jupyter_notebook_for_new_project(_: Mapper, connection: Connection, jupyter_notebook: JupyterNotebookModel):
    session_maker = sessionmaker(bind=connection, autocommit=False)
    session = session_maker()
    with closing(session):
        jupyter_notebook: JupyterNotebookModel = session.query(JupyterNotebookModel).get(jupyter_notebook.id)

        initial_cells_context_map = jupyter_notebook.initial_cells_context_map
        notebook_dumper = jupyter_notebook.jupyter_notebook_dumper
        notebook_dumper.create_notebook(cells_context_map=initial_cells_context_map)


@event.listens_for(JupyterNotebookModel, 'after_delete', propagate=True)
def handle_after_delete_notebook(_: Mapper, connection: Connection, jupyter_notebook: JupyterNotebookModel):
    session_maker = sessionmaker(bind=connection, autocommit=False)
    session = session_maker()
    with closing(session):
        notebook_dumper = jupyter_notebook.jupyter_notebook_dumper
        notebook_dumper.delete_notebook()
