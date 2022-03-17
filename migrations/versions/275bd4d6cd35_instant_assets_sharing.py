"""Instant assets sharing

Revision ID: c2f12b313b48
Revises: 5be51e1d42ff
Create Date: 2022-03-01 13:48:42.551162

"""

"""
 OpenVINO DL Workbench
 Migration: Instant assets sharing

 Copyright (c) 2022 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c2f12b313b48'
down_revision = 'f7fcb58b99cd'
branch_labels = None
depends_on = None


def upgrade():
    op.rename_table('downloadable_artifacts', 'shared_artifacts')
    op.drop_column('create_profiling_bundle_jobs', 'tab_id')

    # Connect bundles from downloadable_artifacts with jobs throw job_id instead of bundle_id
    op.execute("UPDATE shared_artifacts SET job_id=create_profiling_bundle_jobs.job_id FROM create_profiling_bundle_jobs WHERE shared_artifacts.id=create_profiling_bundle_jobs.bundle_id;")
    op.drop_constraint('create_profiling_bundle_jobs_bundle_id_fkey', 'create_profiling_bundle_jobs', type_='foreignkey')
    op.drop_column('create_profiling_bundle_jobs', 'bundle_id')

    op.execute("UPDATE shared_artifacts SET job_id=create_int8_calibration_bundle_jobs.job_id FROM create_int8_calibration_bundle_jobs WHERE shared_artifacts.id=create_int8_calibration_bundle_jobs.bundle_id;")
    op.drop_constraint('create_int8_calibration_bundle_jobs_bundle_id_fkey', 'create_int8_calibration_bundle_jobs',
                       type_='foreignkey')
    op.drop_column('create_int8_calibration_bundle_jobs', 'bundle_id')

    op.execute("UPDATE shared_artifacts SET job_id=create_accuracy_bundle_jobs.job_id FROM create_accuracy_bundle_jobs WHERE shared_artifacts.id=create_accuracy_bundle_jobs.bundle_id;")
    op.drop_constraint('create_accuracy_bundle_jobs_bundle_id_fkey', 'create_accuracy_bundle_jobs', type_='foreignkey')
    op.drop_column('create_accuracy_bundle_jobs', 'bundle_id')

    op.execute("UPDATE shared_artifacts SET job_id=create_annotate_dataset_bundle_jobs.job_id FROM create_annotate_dataset_bundle_jobs WHERE shared_artifacts.id=create_annotate_dataset_bundle_jobs.bundle_id;")
    op.drop_constraint('create_annotate_dataset_bundle_jobs_bundle_id_fkey', 'create_annotate_dataset_bundle_jobs',
                       type_='foreignkey')
    op.drop_column('create_annotate_dataset_bundle_jobs', 'bundle_id')

    op.execute("UPDATE shared_artifacts SET job_id=create_per_tensor_bundle_jobs.job_id FROM create_per_tensor_bundle_jobs WHERE shared_artifacts.id=create_per_tensor_bundle_jobs.bundle_id;")
    op.drop_constraint('create_per_tensor_bundle_jobs_bundle_id_fkey', 'create_per_tensor_bundle_jobs',
                       type_='foreignkey')
    op.drop_column('create_per_tensor_bundle_jobs', 'bundle_id')

    op.add_column('parse_dev_cloud_result_jobs', sa.Column('are_results_obtained', sa.Boolean(), nullable=True))
    op.alter_column('parse_dev_cloud_result_jobs', 'result_artifact_id', existing_type=sa.INTEGER(), nullable=True)

    op.drop_constraint('parse_dev_cloud_result_jobs_result_artifact_id_fkey', 'parse_dev_cloud_result_jobs',
                       type_='foreignkey')
    op.create_foreign_key(None, 'parse_dev_cloud_result_jobs', 'shared_artifacts', ['result_artifact_id'], ['id'])

    op.drop_constraint('trigger_dev_cloud_jobs_job_bundle_id_fkey', 'trigger_dev_cloud_jobs', type_='foreignkey')
    op.drop_constraint('trigger_dev_cloud_profiling_jobs_setup_bundle_id_fkey', 'trigger_dev_cloud_jobs',
                       type_='foreignkey')
    op.create_foreign_key(None, 'trigger_dev_cloud_jobs', 'shared_artifacts', ['job_bundle_id'], ['id'])
    op.create_foreign_key(None, 'trigger_dev_cloud_jobs', 'shared_artifacts', ['setup_bundle_id'], ['id'])
    op.drop_constraint('upload_artifact_to_target_jobs_artifact_id_fkey', 'upload_artifact_to_target_jobs',
                       type_='foreignkey')
    op.create_foreign_key(None, 'upload_artifact_to_target_jobs', 'shared_artifacts', ['artifact_id'], ['id'])

    # ### end Alembic commands ###


def downgrade():
    raise NotImplementedError(f'Downgrade is not implemented for the {revision} migration')
