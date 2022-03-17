"""
 OpenVINO DL Workbench
 Rise algorithm implementation

 Copyright (c) 2021 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""

from typing import Tuple, Callable

import numpy as np
from skimage import transform


class _ProgressReporter:

    def __init__(self, total_steps: int, progress_cb: Callable[[int], None] = None):
        self.prev_progress = 0
        self.total_steps = total_steps
        self.current_step = 0
        self.progress_cb = progress_cb

    def next_step(self):
        self.current_step += 1

        if not self.progress_cb:
            return

        progress = int(self.current_step * (100 / self.total_steps))
        if progress - self.prev_progress >= 1:
            self.progress_cb(progress)
            self.prev_progress = progress


class RISE:
    """
    Rise algorithm implementation
    Paper: https://arxiv.org/pdf/1806.07421.pdf
    Github: https://github.com/eclique/RISE
    """
    NUMBER_OF_RANDOM_MASKS = 2000
    GRID_SIZE = 8
    BINARY_MASK_PROBABILITY = 0.5

    def __init__(self, image_input_size: Tuple[int, int]):
        self.image_input_size = image_input_size

    def generate_masks(self, step_cb: Callable[[], None] = None) -> np.array:
        cell_size = np.ceil(np.array(self.image_input_size) / self.GRID_SIZE)
        up_size = (self.GRID_SIZE + 1) * cell_size

        grid = np.random.rand(self.NUMBER_OF_RANDOM_MASKS, self.GRID_SIZE, self.GRID_SIZE)
        grid = grid < self.BINARY_MASK_PROBABILITY
        grid = grid.astype('float32')

        masks = np.empty((self.NUMBER_OF_RANDOM_MASKS, *self.image_input_size), dtype='float32')

        for i in range(self.NUMBER_OF_RANDOM_MASKS):
            # random shifts
            # pylint: disable=invalid-name
            x = np.random.randint(0, cell_size[0])
            # pylint: disable=invalid-name
            y = np.random.randint(0, cell_size[1])
            # linear upsampling
            upsampled = transform.resize(grid[i], up_size, order=1, mode='reflect', anti_aliasing=False)
            # cropping
            masks[i, :, :] = upsampled[x:x + self.image_input_size[0], y:y + self.image_input_size[1]]

            step_cb()

        masks = masks.reshape((-1, *self.image_input_size, 1))
        return masks

    def explain(self, infer: Callable[[np.array], np.array], image: np.array,
                progress_cb: Callable[[int], None] = None) -> np.array:

        progress_reporter = _ProgressReporter(self.NUMBER_OF_RANDOM_MASKS * 2, progress_cb)

        masks = self.generate_masks(progress_reporter.next_step)

        predictions = []
        # Make sure multiplication is being done for correct axes
        # Convert to uint8 after multiplying by float32 mask
        masked = (image * masks).astype('uint8')
        for i in range(self.NUMBER_OF_RANDOM_MASKS):
            prediction = infer(masked[i])
            predictions.append(prediction)

            progress_reporter.next_step()

        predictions = np.array(predictions)

        reshaped_mask = masks.reshape(self.NUMBER_OF_RANDOM_MASKS, -1)

        explanation_masks = predictions.T.dot(reshaped_mask).reshape(-1, *self.image_input_size)

        explanation_masks = explanation_masks / self.NUMBER_OF_RANDOM_MASKS / self.BINARY_MASK_PROBABILITY
        return explanation_masks
