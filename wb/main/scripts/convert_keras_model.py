"""
 OpenVINO DL Workbench
 Script to convert keras model to saved model

 Copyright (c) 2020 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
from argparse import ArgumentParser

# pylint: disable=import-error
import tensorflow as tf


def convert_keras_model(model: str, destination: str) -> None:
    model = tf.keras.models.load_model(model)
    tf.saved_model.save(model, destination)


def build_argparser():
    parser = ArgumentParser()

    parser.add_argument('--model',
                        help='Path to an .h5 file of the Keras model',
                        required=True,
                        type=str)

    parser.add_argument('--output',
                        help='Path to the resulting saved model file',
                        required=True,
                        type=str)
    return parser


if __name__ == '__main__':
    CLI_ARGS = build_argparser().parse_args()
    convert_keras_model(CLI_ARGS.model, CLI_ARGS.output)
