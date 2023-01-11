// Include OpenVINO header file
#include "openvino/openvino.hpp"
// Include OpenCV header file
#include <opencv2/opencv.hpp>

// Usage:
// ./sample_app path/model.xml 1 4 "CPU"

void wait_for_inference_requests(std::vector<int> &runs, int maximum_number_of_runs) {
    while (true) {
        bool done = std::all_of(runs.begin(), runs.end(), [&maximum_number_of_runs](int i) { return i==maximum_number_of_runs; });
        
        if (done) {
            break;
        }
    }
}

int main(int argc, char *argv[]) {
    if (argc < 5) {
        std::cerr << "Usage: " << argv[0] << " PATH_TO_MODEL_XML NUM_BATCH NUM_STREAMS DEVICE" << std::endl;
        return 1;
    }

    // Parsing arguments
    const std::string model_xml = argv[1];
    const int batch_size = std::stoi(argv[2]);
    const int num_streams = std::stoi(argv[3]);
    const std::string device = argv[4];

    // Reading sample image using OpenCV library
    const std::string image_file_name = "dog.jpg";
    cv::Mat image = cv::imread(image_file_name);

    // Initialize OpenVINO Runtime Core
    ov::Core core;

    // Set the maximum amount of execution streams for the device, indicating how many inference requests can be run simultaneously
    // By default the maximum number is 1, meaning each inference request uses all the execution resources,
    // several inference requests are run one after the other
    core.set_property(device, {{"NUM_STREAMS", std::to_string(num_streams)}});

    // Read model
    std::cout << "READING MODEL...";
    auto model = core.read_model(model_xml);
    std::cout << " DONE" << std::endl << std::endl;

    // Apply preprocessing
    const ov::Layout tensor_layout{"NHWC"};

    ov::preprocess::PrePostProcessor proc(model);
    // 1) input() with no args assumes a model has a single input
    ov::preprocess::InputInfo& input_info = proc.input();
    // 2) Set input tensor information:
    // - precision of tensor is supposed to be 'u8'
    // - layout of data is 'NHWC'
    input_info.tensor().set_element_type(ov::element::u8).set_layout(tensor_layout);
    // 3) Here we suppose model has 'NCHW' layout for input
    input_info.model().set_layout(tensor_layout);
    // 4) output() with no args assumes a model has a single result
    // - output() with no args assumes a model has a single result
    // - precision of tensor is supposed to be 'f32'
    proc.output().tensor().set_element_type(ov::element::f32);
    // 5) Once the build() method is called, the pre(post)processing steps
    // for layout and precision conversions are inserted automatically
    model = proc.build();
    
    // Take information about model inputs
    ov::Shape input_shape = model->input().get_shape();
    
    std::cout << "Model input shape:" << std::endl;
    std::cout << input_shape << std::endl << std::endl;

    // Setting batch size using image count
    ov::set_batch(model, batch_size);
    input_shape = model->input().get_shape();
    std::cout << "Batch size is " << batch_size << std::endl;
    std::cout << "Reshape model input to " << input_shape << std::endl;
    
    // Loading model to the device
    std::cout << std::endl << "LOADING NETWORK ON THE DEVICE...";
    ov::CompiledModel compiled_model = core.compile_model(model, device);
    std::cout << " DONE" << std::endl << std::endl;
    
    // Create a storage for the inference requests
    std::vector<ov::InferRequest> requests(num_streams);
    
    // Create a storage to keep track of how many times each request has run
    // NOTE: this is an artificial restriction created to showcase a lifecycle of inference requests,
    // Most likely, inference requests would not have "maximum number of times" when they are executed in a real-life application
    std::vector<int> runs(num_streams);
    // Initially set it to 0 as inference requests have not run yet
    std::fill(runs.begin(), runs.end(), 0);
    
    // Specify the maximum number of times each request should run
    // NOTE: this is an artificial restriction created to showcase a lifecycle of inference requests,
    // Most likely, inference requests would not have "maximum number of times" when they are executed in a real-life application
    const int maximum_runs = 1;

    std::cout << "Starting async inference..." << std::endl;
    
    // Create the specified number of requests
    for (std::size_t request_number = 0; request_number < num_streams; request_number++) {
        // Create infer request
        requests[request_number] = compiled_model.create_infer_request();

        // Prepare input
        ov::Tensor input_tensor = ov::Tensor(ov::element::u8, input_shape, image.data);
        requests[request_number].set_input_tensor(input_tensor);
        
        requests[request_number].set_callback([request_number, &requests, &runs, &input_tensor](std::exception_ptr ex) {
            if (ex)
                throw ex;
            
            // Increment the number of times the request has run
            runs[request_number] += 1;
            std::cout << "***********************" << std::endl;
            std::cout << "Completed #" << request_number << " request" << std::endl;
            
             // Process output
            ov::Tensor output = requests[request_number].get_output_tensor();
            std::cout << "Output Tensor Shape: "<< output.get_shape() << std::endl;
        
            // Run the inference request again
            // NOTE: this is an artificial restriction created to showcase a lifecycle of inference requests,
            // In a real-life application there would not be "maximumRuns" and the inference request would start again
            if (runs[request_number] < maximum_runs) {
                std::cout << " and runs again" << std::endl;
                // NOTE: In a real-life application a new image (or a set of images) would be passed as the input data
                requests[request_number].set_input_tensor(input_tensor);
                // Run the inference request again
                requests[request_number].start_async();
            }
            std::cout << "***********************" << std::endl << std::endl;
        });
        
        // Start async request for the first time
        requests[request_number].start_async();
    }

    wait_for_inference_requests(runs, maximum_runs);
    return 0;
}
