#include <inference_engine.hpp>
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

    Core ie;
    
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
        ie.SetConfig({{CONFIG_KEY(CPU_THROUGHPUT_STREAMS), std::to_string(numInferReq)}}, device);
    }

    if (device == "GPU") {
        int numStreams = numInferReq;
        if (numStreams % 2) {
            numStreams++;
        }
        ie.SetConfig({{CONFIG_KEY(GPU_THROUGHPUT_STREAMS), std::to_string(numStreams)}}, device);
    }
    // end Set number of streams

    CNNNetwork network = ie.ReadNetwork(modelXml);

    // set batch
    network.setBatchSize(batchSize);

    ExecutableNetwork executableNetwork = ie.LoadNetwork(network, device);

    std::vector<InferRequest> requests(numInferReq);

    std::vector<int> runs(numInferReq);

    std::fill(runs.begin(), runs.end(), 0);

    const int maxNumRuns = 10;
    // create InferRequests
    for (std::size_t i = 0; i < numInferReq; i++) {
        // create an InferRequest
        requests[i] = executableNetwork.CreateInferRequest();
        requests[i].SetCompletionCallback([i, &requests, &runs, maxNumRuns]() {
            auto status = requests[i].Wait(IInferRequest::WaitMode::STATUS_ONLY);
            std::cout << "InferRequest #" << i;
            if (status != OK) {
                std::cout << " done ";
            } else {
                std::cout << " failed ";
            }
            runs[i] += 1;
            if (runs[i] < maxNumRuns) {
                std::cout << "and runs again";
                // run again the InferRequest
                requests[i].StartAsync();
            }
            std::cout << std::endl;
        });
        // run the InferRequest
        requests[i].StartAsync();
    }

    while (true) {
        bool done = std::all_of(runs.begin(), runs.end(), [](int i) { return i==maxNumRuns; });
        if (done){
            break;
        }
    }

    return 0;
}
