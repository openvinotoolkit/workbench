cmake_minimum_required(VERSION 3.10)

project(ie_sample)

set(CMAKE_CXX_STANDARD 14)

set(IE_SAMPLE_NAME ie_sample)

find_package(InferenceEngine REQUIRED)

add_executable(${IE_SAMPLE_NAME} main.cpp ${IE_SAMPLE_SOURCES} ${IE_SAMPLES_HEADERS})

target_link_libraries(${IE_SAMPLE_NAME} PUBLIC ${InferenceEngine_LIBRARIES})