# Import Original Model {#workbench_docs_Workbench_DG_Tutorial_Import_Original}

  Use the following recommendations to make the process of importing original models easier:

1. <a href="#model-format">Check model format</a>

   Сheck whether the model format is supported in the DL Workbench, for example, supported formats include TensorFlow\*, ONNX\*, OpenVINO™ Intermediate Representation (IR), and [others](https://docs.openvino.ai/latest/workbench_docs_Workbench_DG_Select_Models.html#supported-frameworks).

2. <a href="#supported-format">Convert model to supported format</a>

   Optional. Convert the model if its format is not directly supported.

3. <a href="#convert-ir">Import model in DL Workbench</a>

   Obtain a model in Intermediate Representation (IR) format to start working with the DL Workbench.

## <a name="model-format">1. Check Model Format</a>

The import process depends on the framework of your model. Examples of the supported formats: TensorFlow\* (Frozen graph, Checkpoint, Metagraph, SavedModel, Keras H5), ONNX\*, OpenVINO™ IR. 

- If the model is already in the IR format, no further steps are required. Import the model files and proceed to create a project.

- Optional. If the model is in one of the supported  formats, go to <a name="convert-IR">Step 3</a> and import it in the DL Workbench to obtain a model in IR format.

- If the model is not in one of the supported formats, proceed to the next step to convert it to a supported format and then to IR. 

## <a name="supported-format">2. Convert Model to Supported Format</a>
 
To convert the model to one of the input formats supported in the DL Workbench, find a specific format you need to use for your model: 

- If the model is from PyTorch framework, it is recommended to [convert it to the ONNX format](https://docs.openvino.ai/latest/openvino_docs_MO_DG_prepare_model_convert_model_Convert_Model_From_PyTorch.html#export-pytorch-model-to-onnx-format). 

- If the model is trained in another framework, look for a similar topology supported in the [Open Model Zoo (OMZ)](https://github.com/openvinotoolkit/open_model_zoo). 

   1. Open `model.yml` file in the [OMZ repository](https://github.com/openvinotoolkit/open_model_zoo/blob/master/models/public), where you can find the information on:
    - which input format should be used ​for the model of your framework
    - how to convert the model to this format
    - how to configure accuracy of the model

   2. In the `model.yml` file find the Model Optimizer arguments required to convert the model: 
   ![](img/model_optimizer_args.png)

   3. Pay attention to the file extension of the model (for example, `.savedmodel`, `.onnx`, `.pb`, and others). You need to convert your model to the specified format. In the example above, you can see that yolov4 needs to be converted to the TensorFlow `.savedmodel` format.

- If there is no similar model for your use case, it is recommended to use either [ONNX](https://docs.openvino.ai/latest/openvino_docs_MO_DG_prepare_model_convert_model_Convert_Model_From_ONNX.html) or [TensorFlow](https://docs.openvino.ai/latest/openvino_docs_MO_DG_prepare_model_convert_model_Convert_Model_From_TensorFlow.html) formats. Refer to the [Model Optimizer Developer Guide](https://docs.openvino.ai/latest/openvino_docs_MO_DG_prepare_model_convert_model_Converting_Model.html) to learn more general information on importing models from different frameworks.

## <a name="convert-ir">3. Import Model in DL Workbench</a>

As a result of importing your model in the DL Workbench, you will obtain the model in IR format.
For that, go to the DL Workbench and click *Create Project* and *Import Model*.
   ![](img/tutorials/cp_yolo.png)
   ![](img/tutorials/import_start_yolo.png)

Select the framework and provide the folder with the model in one of the supported format.
Next, you need to fill out the import form in the DL Workbench. This information concerns the model training and depends on the framework, for example, the way the input images were fed to the Computer Vision model during training: 
-  color space (BGR, RGB, Grayscale) 
-  applied transformations (mean subtraction, scale factor multiplication)

![](img/tutorials/import_params.png)

After importing your model in the DL Workbench, you can download the IR model and work with OpenVINO components or proceed to [accelerate performance](https://docs.openvino.ai/latest/workbench_docs_Workbench_DG_Int_8_Quantization.html),
visualize model [architecture](https://docs.openvino.ai/latest/workbench_docs_Workbench_DG_Visualize_Model.html) and [outputs](https://docs.openvino.ai/latest/workbench_docs_Workbench_DG_Visualize_Accuracy.html),
[benchmark inferencing performance](https://docs.openvino.ai/latest/workbench_docs_Workbench_Create_Project.html#measure-performance), [measure accuracy](https://docs.openvino.ai/latest/workbench_docs_Workbench_DG_Measure_Accuracy.html), and explore other DL Workbench capabilities.

![](img/model_download.png)

## See Also

* [Next Step: Create Project](Create_Project.md)
* [Import Darknet* YOLOv4 model](Import_YOLO.md)
* [Import Frozen TensorFlow* SSD MobileNet v2 COCO Tutorial](Import_TensorFlow.md)
* [Import ONNX* MobileNet v2 Tutorial](Import_ONNX.md)
* [Import MXNet* MobileNet v2 Tutorial](Import_MXNet.md)
* [Troubleshooting](Troubleshooting.md)
