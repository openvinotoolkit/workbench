cmake_minimum_required(VERSION 3.10)

project(ie_sample)

set(CMAKE_CXX_STANDARD 11)

set(IE_SAMPLE_NAME ie_sample)

find_package(OpenVINO REQUIRED)

add_executable(${IE_SAMPLE_NAME} main.cpp)

target_link_libraries(${IE_SAMPLE_NAME} PUBLIC openvino::runtime)