# Optimize Darknet* YOLOv4 Model {#workbench_docs_Workbench_DG_Tutorial_Yolo}

INT8 Calibration is a universal method for accelerating deep learning models. Calibration is a process of converting a Deep Learning model weights to a lower 8-bit precision such that it needs less computation.

In this tutorial, you will learn how to optimize your model using INT8 Calibration, evaluate the performance boost, and check the difference between original and optimized model accuracy. 

| Model  | Task Type | Framework | Source | Dataset |
| :---: | :---: | :---: | :---: |:---: |
| [yolo-v4](https://docs.openvino.ai/latest/omz_models_model_yolo_v4_tf.html)  | [Object Detection](https://machinelearningmastery.com/object-recognition-with-deep-learning/) | [Darknet*](https://pjreddie.com/darknet/) | [Github repository](https://github.com/AlexeyAB/darknet/releases/tag/yolov4)| [COCO 2017 Val images](http://cocodataset.org) |


Use [Darknet* YOLOv4 Tutorial](Import_YOLO.md) to import the model in the DL Workbench. Refer to the [Dataset Types](Dataset_Types.md) page for more information about dataset import. 

## Optimize Model Using INT8 Calibration

To convert the model to INT8, go to *Perform* tab on the Project page and open *Optimize* subtab. Check *INT8* and click *Optimize*.

![](img/tutorials/optimization_INT8_YOLO.png)

It takes you to the *Optimize INT8* page. Select the imported dataset and perform INT8 Calibration with *Default* optimization method and *Performance Preset* calibration scheme first as it provides maximum performance speedup.

![](img/tutorials/calibration_yolov4.png)

After optimization, you will be redirected to a new Project page for optimized `YOLOv4` model. 

![](img/tutorials/optimized_yolo.png)

To ensure that the optimized model performance is sufficiently accelerated and its predictions can be trusted, evaluate the key characteristics: performance and accuracy.

## Compare Optimized and Parent Model Performance

Go to the model page and check the performance of the imported and optimized models. Compare the throughput numbers and click *Compare Projects*. Learn more about projects comparison on the [Compare Performance](Compare_Performance_between_Two_Versions_of_Models.md) page.

> **NOTE**: Throughput is the number of images processed in a given amount of time. It is measured in frames per second (FPS). Higher throughput value means better performance.

![](img/tutorials/compare_performance_yolo.png)

You can observe that `YOLOv4` model has become 2.4x times faster on CPU device after optimization. 

Lowering the precision of the model using quantization leads to a loss in prediction capability. Therefore you need to assess the model prediction capability to ensure that the model has not lost a significant amount of accuracy. 

## Compare Parent and Optimized Model Predictions 

### Create Accuracy Report

Go to the *Perform* tab and select *Create Accuracy Report*:

![](img/tutorials/accuracy_yolov4.png)

Comparison of Optimized and Parent Model Predictions Report allows you to find out on which validation dataset images the predictions of the model have become different after optimization. To enable the creation of this report type, change your model use case in the accuracy configuration. DL Workbench automatically detects Object Detection use case and other parameters for your model. Click *Save*:

![](img/tutorials/config_filled.png)

You will be redirected back to the *Create Accuracy Report* page. Select *Comparison of Optimized and Parent Model Predictions* and click *Create Accuracy Report*:

![](img/tutorials/create_report_yolo.png)

> **NOTE**: Accuracy measurements are performed on each dataset image. Creating an Accuracy Report may take some time if the dataset is considerably big. 


## Interpret Report Results 

The report has two display options: Basic and Advanced mode. 

### Basic Mode

Each line of the report table in basic mode contains a number of detected objects in the image: **A. Optimized Model Detections**. The number of objects in Parent model predictions for the image is indicated in **B. Parent Model Detections**. If the numbers do not match, the model must be incorrect.

To assess the difference between Optimized and Parent model predictions, check **Matches between A and B**. Matches show the number of times the Optimized model detected the same location of an object as the Parent Model.

 ![](img/tutorials/accuracy_table_yolo_basic.png)

### Advanced Mode

Each line of the report table in advanced mode contains a specific class that the model predicted for the object in the image - **Class Predicted by Optimized Model**. The number of detected objects of predicted class is represented in **A. Optimized Model Detections of Predicted Class**. The number of objects that have the same class in Parent model predictions is indicated in **B. Parent Model Detections of Predicted Class**. If the numbers do not match, the Optimized model might be incorrect.

To assess the difference between Optimized and Parent model predictions, check **Matches between A and B** and **Predicted Class Precision**. Matches show the number of times the Optimized model detected the same location of an object as the Parent Model.

![](img/tutorials/accuracy_table_yolo_advanced.png)


> **TIP:** To sort the numbers from lowest to highest, click on the parameter name in the table.

Click **Visualize** button under the **Actions** column to compare the predictions and annotations for a particular image.

![](img/tutorials/detections_yolo_true.png)

In our case, the `YOLOv4` model detected 2 objects of class 18 (sheep). These detections coincide with the dataset annotations: 2 objects of the same class as predicted by the model. The number of matches also equals 2. In the image, it is shown by almost identical bounding boxes for each object. 

![](img/tutorials/yolo_detection_false.png)

Let's consider another example image. The model detected 1 objects of class 4 (airplane). But in the image, you can see that the bounding  is noticeably different from the parent model prediction. 
 

## Next Step

After evaluating the accuracy, you can decide whether the difference between imported and optimized models predictions is critical or not:

- If the tradeoff between accuracy and performance is too big, [import an annotated dataset](Import_Datasets.md) and use [AccuracyAware optimization method](Int-8_Quantization.md#accuracyaware), then repeat the steps from this tutorial.

- If the tradeoff is acceptable, [explore inference configurations](Deploy_and_Integrate_Performance_Criteria_into_Application.md) to further enhance the performance. Then create a [deployment package](Deployment_Package.md) with your ready-to-deploy model. 

---
## See Also

* [Create Accuracy Report](Measure_Accuracy.md)
* [Configure Accuracy Settings](Accuracy_Configuration.md)
* [Troubleshooting](Troubleshooting.md)