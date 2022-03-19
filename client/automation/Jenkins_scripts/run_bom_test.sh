#!/bin/bash
set -e
cd ${WORKBENCH_FE_DIR}
pytest bom_test.py
