import csv
import sys
from typing import List

try:
    from typing import TypedDict
except ImportError:
    from typing_extensions import TypedDict

from arguments_parser import parse_arguments


class InferenceConfiguration(TypedDict):
    streams: List[int]
    batches: List[int]


INITIAL_CONFIGURATION = InferenceConfiguration(
    streams=[1, 4],
    batches=[1, 1],
)


REFERENCE_CONFIGURATION = InferenceConfiguration(
    streams=[*INITIAL_CONFIGURATION['streams'], 3, 5, 7, 3, 5],
    batches=[*INITIAL_CONFIGURATION['batches'], 2, 2, 2, 3, 3],
)


def check_inference_report_file(inference_report_path: str, reference_configuration: dict) -> int:

    with open(inference_report_path, 'r', encoding='utf-8') as report_file:
        csv_reader = csv.reader(report_file, delimiter=';')

        columns = next(csv_reader)
        for column in columns:
            assert column in ['Stream', 'Batch size', 'Throughput', 'Latency']

        for index_row, row in enumerate(csv_reader):
            stream, batch = int(row[0]), int(row[1])
            throughput, latency = float(row[2]), float(row[3])

            assert stream and batch, 'Stream and/or batch are not numeric. Stream: {}, Batch: {}'.format(stream, batch)

            assert reference_configuration['streams'][index_row] == stream, \
                'Streams are not from the expected configuration. Actual: {}, Expected: {}' \
                .format(stream, reference_configuration['streams'][index_row])

            assert reference_configuration['batches'][index_row] == batch, \
                'Batches are not from the expected configuration. Actual: {}, Expected: {}' \
                .format(batch, reference_configuration['batches'][index_row])

            assert throughput and latency, 'Throughput and/or latency are not numeric. Throughput: {}, latency: {}' \
                .format(throughput, latency)

    return 0


if __name__ == '__main__':
    args = parse_arguments()

    sys.exit(check_inference_report_file(args.inference_report_path, REFERENCE_CONFIGURATION))
