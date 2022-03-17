cmake_minimum_required(VERSION 3.10)

project(sample_app)

find_package(ngraph REQUIRED)
find_package(InferenceEngine REQUIRED)
find_package(OpenCV REQUIRED)

add_executable(${PROJECT_NAME} main.cpp)

target_link_libraries(${PROJECT_NAME} PUBLIC ${InferenceEngine_LIBRARIES} ${OpenCV_LIBS} ${NGRAPH_LIBRARIES})
