#include "openvino/openvino.hpp"
#include <vector>

using namespace InferenceEngine;

// ./ie_sample path/model.xml CPU 1 4

int main(int argc, char *argv[]) {
    if (argc < 5) {
        std::cerr << "Usage: " << argv[0] << " PATH_TO_MODEL_XML DEVICE NUM_INFER_REQUEST NUM_BATCH" << std::endl;
        return 1;
    }

    const std::string modelXml = argv[1];

    std::string device = argv[2];

    const int batchSize = std::stoi(argv[3]);

    const int numInferReq = std::stoi(argv[4]);

    std::transform(device.begin(), device.end(), device.begin(), ::toupper);

    ov::Core core;
    
    // ___GPU___
    // |   |   |
    // |___|___|
    // |   |   |
    // |___|___|
    //
    // ___CPU___
    // |       |
    // |       |
    // |       |
    // |___ ___|
    
    // start Set number of streams
    if (device == "CPU") {
        core.set_property(device, {{CONFIG_KEY(CPU_THROUGHPUT_STREAMS), numInferReq}});
    }

    if (device == "GPU") {
        core.set_property(device, {{CONFIG_KEY(GPU_THROUGHPUT_STREAMS), numInferReq}});
    }
    // end Set number of streams

    auto model = core.read_model(modelXml);

    ov::CompiledModel compiled_model = core.compile_model(model, device);

    std::vector<ov::InferRequest> requests(numInferReq);

    std::vector<int> runs(numInferReq);

    std::fill(runs.begin(), runs.end(), 0);

    const int maxNumRuns = 10;
    // create InferRequests
    for (std::size_t i = 0; i < numInferReq; i++) {
        // create an InferRequest
        requests[i] = compiled_model.create_infer_request();
        requests[i].set_callback([i, &requests, &runs, maxNumRuns](std::exception_ptr ex) {
            std::cout << "InferRequest #" << i << " ";
            runs[i] += 1;
            if (runs[i] < maxNumRuns) {
                std::cout << "runs again";
                // run again the InferRequest
                requests[i].start_async();
            }
            std::cout << std::endl;
        });
        // run the InferRequest
        requests[i].start_async();
    }

    while (true) {
        bool done = std::all_of(runs.begin(), runs.end(), [](int i) { return i==maxNumRuns; });
        if (done){
            break;
        }
    }

    return 0;
}
