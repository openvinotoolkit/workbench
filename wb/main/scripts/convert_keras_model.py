"""
 OpenVINO DL Workbench
 Script to convert keras model to saved model

 Copyright (c) 2020 Intel Corporation

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
