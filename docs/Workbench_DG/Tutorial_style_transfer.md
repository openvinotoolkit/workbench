# Optimize Style Transfer Model {#workbench_docs_Workbench_DG_Tutorial_Style_Transfer}

## Summary

INT8 Calibration is a universal method for accelerating deep learning models. Calibration is a process of converting a Deep Learning model weights to a lower 8-bit precision such that it needs less computation.

In this tutorial, you will learn how to optimize your model using INT8 Calibration, examine how much quicker the model has become, and check the difference between original and optimized model accuracy. 

| Model  | Task Type | Framework | Source | Dataset |
| :---: | :---: | :---: | :---: |:---: |
| [fast-neural-style-mosaic-onnx](https://docs.openvinotoolkit.org/latest/omz_models_model_fast_neural_style_mosaic_onnx.html)  | [Style Transfer](https://paperswithcode.com/task/style-transfer) | [ONNX\*](https://onnx.ai/)  | [Open Model Zoo](https://github.com/openvinotoolkit/open_model_zoo/tree/master/models/public/fast-neural-style-mosaic-onnx)| [Not Annotated dataset](Dataset_Types.md) |

You can learn how to [import the model](Select_Model.md) and [create a not annotated dataset](Create_Project.md) in the DL Workbench [Get Started Guide](Work_with_Models_and_Sample_Datasets.md).

## Optimize Model Using INT8 Calibration

To convert the model to INT8, go to  **Perform** tab on the Project page and open **Optimize** subtab. Check **INT8** and click **Optimize**.

![](img/tutorials/style-optimize.png)

It takes you to the **Optimize INT8** page. Select the imported dataset and perform INT8 Calibration with Default optimization method and Performance Preset calibration scheme first as it provides maximum performance speedup.

![](img/tutorials/int-8-configurations.png)

After optimization, you will be redirected to a new Project page for optimized  `mobilenet-v2` model. 

![](img/tutorials/optimized_style_transfer.png)

To ensure that the optimized model performance is sufficiently accelerated and its predictions can be trusted, evaluate the key characteristics: performance and accuracy.

## Compare Optimized and Parent Model Performance

Go to the model page and check the performance of the imported and optimized models. Compare the throughput numbers and click **Compare Projects**. Read about projects comparison on the [Compare Performance](Compare_Performance_between_Two_Versions_of_Models.md) page.

![](img/tutorials/compare_style_transfer.png)

> **NOTE**: Throughput is the number of images processed in a given amount of time. It is measured in frames per second (FPS). Higher throughput value means better performance.

You can observe that `fast-neural-style-mosaic-onnx` model has become 1.7x times faster on CPU device after optimization. 

Lowering the precision of the model using quantization leads to a loss in prediction capability. Therefore you need to assess the model prediction capability to ensure that you have not lost a significant amount of accuracy. 

## Compare Parent and Optimized Model Predictions 

### Create Accuracy Report

To measure accuracy of the model, go to the **Perform** tab and select **Create Accuracy Report**:

![](img/tutorials/calculation_of_TD.png)

Calculation of Tensor Distance to Parent Model Output Report allows to evaluate the mean squared error (MSE) between Optimized and Parent models output on tensor level for each image in the validation dataset. Mean Squared Error (MSE) is an average of the square of the difference between actual and estimated values. MSE evaluation enables you to identify differences between Parent and Optimized model predictions for a wider set of use cases besides classification and object detection.

> **TIP**:  To sort the numbers from lowest to highest, click on the parameter name in the table.

### Visualize Model Predictions

Even though the comparison with Parent model predictions is not available for the models of Style Transfer use case, you still can compare the Optimized and Parent model outputs using DL Workbench visualization feature.

Sort the images to find the largest MSE number and click **Visualize**.

![](img/tutorials/td_mse.png)

Find this image in the dataset, go to **Perform** tab and upload the image to **Visualize Output**.

![](img/tutorials/visualize_style_transfer.png)

Click **Visualize** to see the results:

![](img/tutorials/optimized_model_style.png)

Save the output image locally. Then open Parent model project, repeat the visualization step, and compare the outputs:

![](img/tutorials/parent_style.png)


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