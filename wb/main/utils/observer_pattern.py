"""
 OpenVINO DL Workbench
 Classes describing Observer pattern

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
from abc import abstractmethod
from functools import wraps
from typing import List, TypeVar


class Observer:
    @abstractmethod
    def update(self, subject_state):
        pass


SubjectStateType = TypeVar('SubjectStateType')


def notify_decorator(function):
    @wraps(function)
    def decorated_function(subject: 'Subject', *args, **kwargs):
        result = function(subject, *args, **kwargs)
        subject.notify()
        return result

    return decorated_function


class Subject:
    def __init__(self):
        self._observers: List[Observer] = []
        self._subject_state: SubjectStateType = None

    def attach(self, observer: Observer):
        self._observers.append(observer)

    def detach(self, observer: Observer):
        self._observers.remove(observer)

    def detach_all_observers(self):
        self._observers.clear()

    def notify(self):
        for observer in self._observers:
            observer.update(self._subject_state)

    @property
    def subject_state(self) -> SubjectStateType:
        return self._subject_state

    @subject_state.setter
    @notify_decorator
    def subject_state(self, new_state: SubjectStateType):
        self._subject_state = new_state
