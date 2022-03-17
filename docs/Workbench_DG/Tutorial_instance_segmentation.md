# Optimize Instance Segmentation Model {#workbench_docs_Workbench_DG_Tutorial_Instance_Segmantation}

## Summary

INT8 Calibration is a universal method for accelerating deep learning models. Calibration is a process of converting a Deep Learning model weights to a lower 8-bit precision such that it needs less computation.

In this tutorial, you will learn how to optimize your model using INT8 Calibration, examine how much quicker the model has become, and check the difference between original and optimized model accuracy. 

| Model  | Task Type | Format | Source | Dataset |
| :---: | :---: | :---: | :---: |:---: |
| [instance-segmentation-security-0002](https://docs.openvino.ai/latest/omz_models_model_instance_segmentation_security_0002.html)  | [Instance Segmentation](https://paperswithcode.com/task/instance-segmentation) | [OpenVINO IR\*](https://docs.openvino.ai/latest/workbench_docs_Workbench_DG_Key_Concepts.html#intermediate-representation-ir) | [Open Model Zoo](https://github.com/openvinotoolkit/open_model_zoo/tree/master/models/intel/instance-segmentation-security-0002)| [Not Annotated](Dataset_Types.md) |

> **TIP**: You can learn how to [import the model](Select_Model.md) and [create a not annotated dataset](Create_Project.md) in the DL Workbench [Get Started Guide](Work_with_Models_and_Sample_Datasets.md).

## Optimize Model Using INT8 Calibration

To convert the model to INT8, go to  **Perform** tab on the Project page and open **Optimize** subtab. Check **INT8** and click **Optimize**.

![](img/tutorials/optimize_instance_segmentation.png)

It takes you to the **Optimize INT8** page. Select the imported dataset and perform INT8 Calibration with Default optimization method and Performance Preset calibration scheme first as it provides maximum performance speedup.

![](img/tutorials/optimization_settings_segmentation.png)

After optimization, you will be redirected to a new Project page for optimized `instance-segmentation-security-0002` model. 

![](img/tutorials/optimized_instance_segmentation.png)

To ensure that the optimized model performance is sufficiently accelerated and its predictions can be trusted, evaluate the key characteristics: performance and accuracy.

## Compare Optimized and Parent Model Performance

Go back to the model page and check the performance of the imported and optimized models. Compare the throughput numbers and click **Compare Projects** button to see more details. Learn more about projects comparison on the [Compare Performance](Compare_Performance_between_Two_Versions_of_Models.md) page.

> **NOTE:** Throughput is the number of images processed in a given amount of time. It is measured in frames per second (FPS). Higher throughput value means better performance.

![](img/tutorials/compare_instance_segmentation.png)

You can observe that `instance-segmentation-security-0002` model has become 2x times faster on CPU device after optimization. 

Lowering the precision of the model using quantization leads to a loss in prediction capability. Therefore you need to assess the model prediction capability to ensure that the model has not lost a significant amount of accuracy. 

## Compare Parent and Optimized Model Predictions 

### Create Accuracy Report

Comparison of Optimized and Parent Model Predictions Report allows you to find out on which validation dataset images the predictions of the model have become different after optimization. Let's compare Optimized model predictions with Parent model predictions used as optimal references. 

Create an Accuracy Report that allows you to visualize and compare Optimized and Parent model predictions. Go to the **Perform** tab and select **Create Accuracy Report**:

![](img/tutorials/create_accuracy_report_instance.png)

To get a report for an instance segmentation model, you need to select **Provide accuracy configuration** and delete the following part: 

![](img/tutorials/instance_segm_config.png)


### Interpret Report Results

The report has two display options: Basic and Advanced mode. 

### Basic Mode

Each line of the report table in basic mode contains a number of detected objects in the image: **A. Optimized Model Detections**. The number of objects in Parent model predictions for the image is indicated in **B. Parent Model Detections**. If the numbers do not match, the model must be incorrect.

To assess the difference between Optimized and Parent model predictions, check **Matches between A and B**. Matches show the number of times the Optimized model detected the same location of an object as the Parent Model.

 ![](img/tutorials/accuracy_table_basic.png)

### Advanced Mode

Each line of the report table in advanced mode contains a specific class that the model predicted for the object in the image - **Class Predicted by Optimized Model**. The number of detected objects of predicted class is represented in **A. Optimized Model Detections of Predicted Class**. The number of objects that have the same class in Parent model predictions is indicated in **B. Parent Model Detections of Predicted Class**. If the numbers do not match, the Optimized model might be incorrect.

To assess the difference between Optimized and Parent model predictions, check **Matches between A and B** and **Predicted Class Precision**. Matches show the number of times the Optimized model detected the same location of an object as the Parent Model.

![](img/tutorials/accuracy_table_advanced.png)


> **TIP:**  To sort the numbers from lowest to highest, click on the parameter name in the table.

Click **Visualize** to see the prediction difference:

![](img/tutorials/instance_segmentation_results.png)

In our case, the optimized `instance-segmentation-security-0002` model recognized all object of class #21 (bear). You can see that the clustering parts for each object coincide in Optimized and Parent model predictions.

![](img/tutorials/instance_segmentation_fail.png)

In another example, clustering parts for each object in Optimized `instance-segmentation-security-0002` predictions for class 22 (zebra) are considerably less accurate than the Parent model prediction. 

## Next Step

After evaluating the accuracy, you can decide whether the difference between imported and optimized models predictions is critical or not:

- If the tradeoff between accuracy and performance is too big, [import an annotated dataset](Import_Datasets.md) and use [AccuracyAware optimization method](Int-8_Quantization.md#accuracyaware), then repeat the steps from this tutorial.

- If the tradeoff is acceptable, [explore inference configurations](Deploy_and_Integrate_Performance_Criteria_into_Application.md) to further enhance the performance. Then create a [deployment package](Deployment_Package.md) with your ready-to-deploy model. 

*All images were taken from ImageNet, Pascal Visual Object Classes, and Common Objects in Context datasets for demonstration purposes only.*

## See Also

* [Create Accuracy Report](Measure_Accuracy.md)
* [Object Detection model tutorial](Tutorial_object_detection_dataset.md)
* [Classification model tutorial](Tutorial_classification_dataset.md)
* [Optimize Classification model tutorial](Tutorial_classification_dataset.md)
* [Optimize Object Detection model tutorial](Tutorial_object_detection.md)
* [Configure Accuracy Settings](Accuracy_Configuration.md)
* [Troubleshooting](Troubleshooting.md)