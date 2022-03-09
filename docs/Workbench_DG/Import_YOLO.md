# Tutorial Darknet* YOLOv4 Model {#workbench_docs_Workbench_DG_Tutorial_Import_YOLO}

The tutorial follows the [recommendations on importing an original model](Import_Custom_Model.md) and shows how to import an original [Darknet* YOLOv4 model](https://docs.openvino.ai/latest/omz_models_model_yolo_v4_tf.html) of [object detection](https://machinelearningmastery.com/object-recognition-with-deep-learning/) use case, and [Darknet*](https://pjreddie.com/darknet/) framework.

| Model  | Use Case | Framework | Source | Dataset | 
| :---: | :---: | :---: | :---: | :---: | 
| [yolo-v4](https://docs.openvino.ai/latest/omz_models_model_yolo_v4_tf.html)  | [Object Detection](https://machinelearningmastery.com/object-recognition-with-deep-learning/) | [Darknet*](https://pjreddie.com/darknet/) | [Github repository](https://github.com/AlexeyAB/darknet/releases/tag/yolov4)| [Not Annotated](http://openvino-docs.inn.intel.com/latest/workbench_docs_Workbench_DG_Generate_Datasets.html#upload-not-annotated-datasets) |

In this tutorial, you will learn how to:

1. Import the model.
2. Create a dataset.
3. Analyze the model inferencing performance.
4. Optimize the model.
5. Analyze the model accuracy performance.
6. Create deployment package with the model.

## Import the model

@sphinxdirective

.. dropdown:: Import YOLOv4

   1. Obtain Model

   Darknet model is represented as `.weights` and `.cfg` files. `Download`_ a pretrained model file `yolov4.weights` from `the following GitHub repository`_.

   .. _Download: https://github.com/AlexeyAB/darknet/releases/tag/yolov4

   .. _the following GitHub repository: https://github.com/AlexeyAB/darknet/releases/tag/yolov4

   2. Convert Model to Supported Format
    
   Convert the model to one of the input formats supported in the DL Workbench, for example, TensorFlow\*, ONNX\*, OpenVINO™ Intermediate Representation (IR), and `other formats_`.  
    
   .. _other formats: https://docs.openvino.ai/latest/workbench_docs_Workbench_DG_Select_Models.html#supported-frameworks

   2.1 Find Similar Model Topology in the Open Model Zoo

   Since the model is not supported directly in the OpenVINO and the DL Workbench, according to the :ref:`model import recommendations <import custom model>`, you need to convert it to a supported format. To do that, look for a similar topology in the `Open Model Zoo repository`_. 
    
   .. _Open Model Zoo repository: https://github.com/openvinotoolkit/open_model_zoo

   Go to the `Open Model Zoo (OMZ) documentation`_ , find `YOLOv4`_ model, and use the information to get the required model description:

   * which input format should be used ​for the model of your framework
   * how to convert the model to this format
   * how to configure accuracy of the model
   
   .. _Open Model Zoo (OMZ) documentation: https://docs.openvino.ai/latest/omz_models_group_public.html

   .. _YOLOv4: https://docs.openvino.ai/latest/omz_models_model_yolo_v4_tf.html

   2.2  Find Converter Parameters

   Open `model.yml` file in the `OMZ repository`_, and find the information on the model input format. Here you can see that the required format for the YOLOv4 model is SavedModel:

   .. image:: _static/images/yml_file_info.png

   .. _OMZ repository: https://github.com/openvinotoolkit/open_model_zoo/blob/master/models/public/yolo-v4-tf/model.yml

   Open the `pre-convert.py` `file`_, and find the parameters required to use the converter: the configuration file, the weights file, and the path to the converted model. 

   .. _file: https://github.com/openvinotoolkit/open_model_zoo/blob/master/models/public/yolo-v4-tf/pre-convert.py

   .. image:: _static/images/required_params.png

   2.3 Download Darknet-to-TensorFlow Converter

   Go to the `converter repository`_ and clone it: 

   .. _converter repository: https://github.com/david8862/keras-YOLOv3-model-set

   .. tab:: macOS, Linux
        
       .. code-block:: sh
        
          git clone https://github.com/david8862/keras-YOLOv3-model-set.git
        
   .. tab:: Windows
        
       .. code-block:: bat
        
          git clone https://github.com/david8862/keras-YOLOv3-model-set.git
        
   2.4 Optional. Prepare Virtual Environment

   Install Virtual Environment 

   .. tab:: macOS, Linux
        
       .. code-block:: sh
        
          python3 -m pip install virtualenv
        
   .. tab:: Windows
        
       .. code-block:: bat
        
          python -m pip install virtualenv
            
   Create Virtual Environment 

   .. tab:: macOS, Linux
        
       .. code-block:: sh
        
          python3 -m virtualenv venv
        
   .. tab:: Windows
        
       .. code-block:: bat
        
          python -m virtualenv venv
        
   Activate Virtual Environment

   .. tab:: macOS, Linux
        
       .. code-block:: sh
        
         source venv/bin/activate
        
   .. tab:: Windows
        
       .. code-block:: bat
        
         venv\Scripts\activate

   2.5 Install Requirements

   Go to the `requirements.txt` file to find the converter dependencies. Adjust it for your system, if necessary. For example, if you do not have a GPU device, change `tensorflow-gpu` dependency to `tensorflow`. Install the requirements:

   .. tab:: macOS, Linux
            
       .. code-block:: sh
            
          python3 -m pip install -r ./keras-YOLOv3-model-set/requirements.txt 
            
   .. tab:: Windows
            
       .. code-block:: bat
            
           python -m pip install -r .\keras-YOLOv3-model-set\requirements.txt 

   2.6 Convert Darknet Model to TensorFlow

   Run the converter by providing the paths to the configuration file, the pretrained model file, and the converted model.

   In case you fine-tuned your model based on the publicly available configuration file of the Yolov4, you also need to use `--yolo4_reorder` flag. If you did not, open the configuration file `yolov4.cfg` and check the order of  `yolo` layers. If the `yolo` layers are described in ascending order, then you can proceed without this flag. Otherwise, you need to use it.

   .. tab:: Does not require reordering:
                
      .. image:: _static/images/layers_yolov3.png

   .. tab:: Requires reordering:            

      .. image:: _static/images/layers_yolov4.png

   Organize the folders and files as follows and execute the code in the terminal or PowerShell:

   .. code-block:: sh

      |-- keras-YOLOv3-model-set
         |-- tools
               |-- model_converter
                  |-- convert.py 
         |-- cfg
         |-- yolov4.cfg
        |-- yolov4.weights
      |-- saved_model

   Run the converter:
                
   .. tab:: macOS, Linux
                
      .. code-block:: sh
                
         python keras-YOLOv3-model-set/tools/model_converter/convert.py keras-YOLOv3-model-set/cfg/yolov4.cfg yolov4.weights yolov4.savedmodel --yolo4_reorder
                
   .. tab:: Windows
                
      .. code-block:: bat
                
         python keras-YOLOv3-model-set\tools\model_converter\convert.py keras-YOLOv3-model-set\cfg\yolov4.cfg yolov4.weights yolov4.savedmodel --yolo4_reorder

   3. Upload Model

   Open the DL Workbench in your browser and click **Create Project** on the Start Page.

   .. image:: _static/images/start_page_dl_wb.png

   On the Create Project page, select **Import Model**.

   .. image:: _static/images/import_model.png

   Open **Original Model** tab:

   - Select **TensorFlow** framework and **2.X TensorFlow** version. 
   - Click **Select Folder** and provide the folder with the model in SavedModel format. Make sure you selected the folder, **not** the files it contains, and click **Import**.

   .. image:: _static/images/import_yolov4.png
   
   .. note::

      To work with OpenVINO tools, you need to obtain a model in Intermediate Representation (IR) format.  IR is the OpenVINO format of pre-trained model representation with two files: XML file describing the network topology and BIN file containing weights.

   Specify model parameters:

   - Select **RGB** color space in *General Parameters* since it was used during model training

   .. image:: _static/images/rgb.png

   - Specify Inputs:  

   .. image:: _static/images/inputs.png

   - Check Specify Inputs (Optional)
   - Select NHWC layout as the Original Layout
   - Set the following parameters:

   - N = 1: number of images in the batch
   - H = 608: image height
   - W = 608: image width
   - C = 3: number of channels, RGB

   - Set scales to **255** as specified in the Darknet `sources`_:

   .. _sources: https://github.com/AlexeyAB/darknet/blob/ca43bbdaaede5c9cbf82a8a0aa5e2d0a4bdcabc0/src/image.c#L957

   .. image:: _static/images/scales.png

   - Click **Convert and Import**

   You will be redirected to the *Create Project* page where you can see the status of the model import.

   **Optional. Visualize Model** 

   To check how your model works and explore its properties, click *Open* under the *Actions* column.

   .. image:: _static/images/open_yolo_model.png

   Upload your image and check the prediction boxes to evaluate the model:

   .. image:: _static/images/check_yolo_model.png

   .. note::
      
      If the imported model predicts the right classes, but the boxes are not aligned with the objects in the image, you might have missed scales and means parameters during import. Refer to the `OMZ documentation`_ and try to import the model again.

      .. _OMZ documentation: https://github.com/openvinotoolkit/open_model_zoo 
    
   Go back to the **Create Project** page, click on the model to select it and proceed to the **Next Step**.

   .. image:: _static/images/yolov4_imported.png

   On the Select Environment stage you can choose a hardware accelerator on which the model will be executed. Choose Core i7-10700T and proceed to select a dataset.

   .. image:: _static/images/select_environment.png

@endsphinxdirective

## Create a dataset

@sphinxdirective

.. dropdown:: Upload Not Annotated Dataset 

   Validation of the model is always performed against specific data combined into datasets. The data can be in different formats, depending on the task for which the model has been trained. Learn more in the Dataset Types documentation. 

   On the third step, click **Import Image Dataset**.
    
   .. image:: _static/images/import_image_dataset.png

   For this tutorial, we will create a Not Annotated dataset with default images from the DL Workbench. Add images representing your specific use case and use augmentation, if necessary. Click **Import**.

   .. image:: _static/images/dataset.png

   Select the dataset by clicking on it, and click **Create Project**.

   .. image:: _static/images/create_project_yolo.png

@endsphinxdirective


## Analyze the model inferencing performance

@sphinxdirective

.. dropdown:: Measure inferencing performance and learn about streams and batches
   :open:

   When the baseline inference stage is finished, we can see the results of running our model on the CPU. We are interested in two metrics: **latency** and **throughput**. 

   - Latency is the time required to process one image. The lower the value, the better. 
   - Throughput is the number of images (frames) processed per second. Higher throughput value means better performance.

   .. image:: _static/images/performance.png

   **Streams** are the number of instances of your model running simultaneously, and **batches** are the number of input data instances fed to the model.  
    
   DL Workbench automatically selects the parameters to achieve a near-optimal model performance. You can further accelerate your model by :ref:`configuring the optimal parameters specific to each accelerator <run inference>`.

@endsphinxdirective

## Optimize the model

@sphinxdirective

.. dropdown:: Optimize performance using INT8 Calibration
   :open:

   One of the common ways to accelerate your model performance is to use **8-bit integer (INT8) calibration**. Calibration is the process of lowering the model precision by converting floating-point operations (for example, 32-bit or 16-bit operations) to the nearest 8-bit integer operations. INT8 Calibration accelerates Deep Learning inference while reducing the model size at the cost of accuracy drop.

   To calibrate a model and then execute it in the INT8 precision, open **Optimize Performance** tab and click **Configure Optimization** button.

   .. image:: _static/images/optimize_face_detection.png

   The **Default Method** and **Performance Preset** are already selected to achieve better performance results. Click **Optimize**:

   .. image:: _static/images/optimization_settings.png

   The project with the **optimized yolov4 model** page opens automatically. To check the performance boost after optimization, go to **Perform** tab and open **Optimize Performance** subtab.

   .. image:: _static/images/performance_change.jpeg

   From the optimization results, we see that our model has become **2.51x** time faster and takes up **1.47x** times less memory. Let's proceed to the next step and check the optimized model accuracy.

@endsphinxdirective

## Measure Accuracy 

@sphinxdirective

.. dropdown:: Compare optimized and original model accuracy performance
   :open:

   Go to the **Perform** tab and select **Create Accuracy Report**:

   .. image:: _static/images/accuracy_yolov4.png

   Comparison of Optimized and Parent Model Predictions Report allows you to find out on which validation dataset images the predictions of the model have become different after optimization. 

   To enable the creation of this report type, change your model use case in the accuracy configuration. DL Workbench automatically detects Object Detection use case and other parameters for your model. Click **Save**:

   .. image:: _static/images/config_filled.png

   You will be redirected back to the **Create Accuracy Report** page. Select **Comparison of Optimized and Parent Model Predictions** and click **Create Accuracy Report**:

   .. image:: _static/images/create_report_yolo.png

   Accuracy measurements are performed on each dataset image. Creating an Accuracy Report may take some time if the dataset is considerably big. 

   **Interpret Report Results**

   The report has two display options: Basic and Advanced mode. To learn more about each column of the Accuracy Report, refer to Interpreting Accuracy Report page. 

   Each line of the report table in basic mode contains a number of detected objects in the image: **A. Optimized Model Detections**. The number of objects in Parent model predictions for the image is indicated in **B. Parent Model Detections**. If the numbers do not match, the model must be incorrect.

   To assess the difference between Optimized and Parent model predictions, check **Matches between A and B**. Matches show the number of times the Optimized model detected the same location of an object as the Parent Model.

   .. image:: _static/images/accuracy_table_yolo_basic.png

   .. note::

      To sort the numbers from lowest to highest, click on the parameter name in the table.

   Click **Visualize** button under the **Actions** column to compare the predictions and annotations for a particular image.

   .. image:: _static/images/detections_yolo_true.png

   In our case, the `YOLOv4` model detected 2 objects of class 18 (sheep). These detections coincide with the dataset annotations: 2 objects of the same class as predicted by the model. The number of matches also equals 2. In the image, it is shown by almost identical bounding boxes for each object. 

   .. image:: _static/images/yolo_detection_false.png

   Let's consider another example image. The model detected 1 objects of class 4 (airplane). But in the image, you can see that the bounding  is noticeably different from the parent model prediction. 
    
   After evaluating the accuracy, you can decide whether the difference between imported and optimized models predictions is critical or not:

   - If the tradeoff between accuracy and performance is too big, import an annotated dataset  and use AccuracyAware optimization method, then repeat the steps from this tutorial.

   - If the tradeoff is acceptable, explore inference configurations to further enhance the performance. Then create a deployment package with your ready-to-deploy model. 

@endsphinxdirective

## Create deployment package with the model

@sphinxdirective

.. dropdown:: Prepare a runtime for your application

   OpenVINO allows to obtain a customized runtime to prepare an application for production. Open **Create Deployment Package** tab and include the necessary components to get a snapshot of OpenVINO runtime ready for deployment into a business application.

   .. image:: _static/images/pack.png

@endsphinxdirective

## See Also

Congratulations! You have completed the DL Workbench workflow for yolov4 model. Additionally, you can try the following capabilities:

* [Learn OpenVINO CLI and API in Jupyter Notebooks](Jupyter_Notebooks_CLI.md)
* [Explore inference configurations](Run_Single_Inference.md)
* [Write sample application with your model using OpenVINO Python or C++ API](Deploy_and_Integrate_Performance_Criteria_into_Application.md)
* [Analyze and visualize model structure](Visualize_Model.md)