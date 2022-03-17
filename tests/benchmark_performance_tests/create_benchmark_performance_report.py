import argparse

from benchmark_performance_report import BenchmarkPerformanceReportConfig, BenchmarkPerformanceReport
from benchmark_performance_report_dumper import BenchmarkPerformanceReportDumper


def parse_arguments():
    parser = argparse.ArgumentParser()

    parser.add_argument('--model-xml-path',
                        required=True,
                        help='Path to the model xml file')

    parser.add_argument('--dataset-path',
                        required=True,
                        help='Path to the dataset directory')

    parser.add_argument('--report-file-path',
                        required=True,
                        help='Path to the result benchmark performance report json file')

    return parser.parse_args()


if __name__ == '__main__':
    args = parse_arguments()
    model_xml_path = args.model_xml_path
    dataset_path = args.dataset_path
    report_file_path = args.report_file_path
    report_config = BenchmarkPerformanceReportConfig(model_xml_path=model_xml_path, dataset_path=dataset_path)
    report = BenchmarkPerformanceReport(config=report_config)
    report_dumper = BenchmarkPerformanceReportDumper(report=report, report_file_path=report_file_path)
    report_dumper.create_report()
