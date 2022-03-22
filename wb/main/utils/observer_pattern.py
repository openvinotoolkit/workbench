"""
 OpenVINO DL Workbench
 Classes describing Observer pattern

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
