"""
Tests for CVSInferenceReport
"""
import os

# pylint: disable=unused-import
from wb.config.application import get_config
from wb.utils.benchmark_report.benchmark_report import BenchmarkReport
from config.constants import BENCHMARK_REPORT_FILE_NAME

TEST_DEVICE_NAME = 'TestDevice'
TEST_LATENCY_VALUE = 271.53
TEST_THROUGHPUT_VALUE = 7.37
TEST_TOTAL_EXEC_TIME_VALUE = 20364.17

REPORT = BenchmarkReport(os.path.join(os.environ['RESOURCES_PATH'], 'reports', BENCHMARK_REPORT_FILE_NAME))


def test_device():
    assert REPORT.device == TEST_DEVICE_NAME  # nosec: assert_used


def test_latency():
    assert REPORT.latency == TEST_LATENCY_VALUE  # nosec: assert_used


def test_throughput():
    assert REPORT.throughput == TEST_THROUGHPUT_VALUE  # nosec: assert_used


def test_total_exec_time():
    assert REPORT.total_exec_time == TEST_TOTAL_EXEC_TIME_VALUE  # nosec: assert_used
