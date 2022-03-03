# Create Accuracy Report {#workbench_docs_Workbench_DG_Measure_Accuracy}

@sphinxdirective

.. toctree::
   :maxdepth: 1
   :hidden:
   
   workbench_docs_Workbench_DG_Accuracy_Configuration
   workbench_docs_Workbench_DG_Configure_Accuracy_Settings
   workbench_docs_Workbench_DG_Measure_Accuracy_Object_detection
   workbench_docs_Workbench_DG_Measure_Accuracy_Classification

@endsphinxdirective

> **NOTE**: Accuracy Measurements are not available for Natural Language Processing models. 

Once you select a model and a dataset and run a baseline inference, the **Projects** page appears. Go to the **Perform** tab and select **Create Accuracy Report**:

![](img/accuracy_report/create_report.png)

## Accuracy Report Types

In the DL Workbench, you can create the following reports:

- <a href="#dataset-annotations">Accuracy Evaluation on Validation Dataset</a>
- <a href="#model-predictions">Comparison of Optimized and Parent Model Predictions</a>
- <a href="#tensor-distance">Calculation of Tensor Distance to Parent Model Output</a>

Requirement | Accuracy Evaluation on Validation Dataset|  Comparison of Optimized and Parent Model Predictions  | Calculation of Tensor Distance to Parent Model Output |
|------------------|------------------|------------------|------------------ |
|Model |Original or Optimized |Optimized| Optimized|
|Dataset​|Annotated​|Annotated or Not Annotated| Annotated or Not Annotated|
|Use Case​| Classification, Object-Detection, Instance-Segmentation, Semantic-Segmentation, Super-Resolution, Style-Transfer, Image-Inpainting |Classification, Object-Detection, Instance-Segmentation, Semantic-Segmentation|Classification, Object-Detection, Instance-Segmentation, Semantic-Segmentation, Super-Resolution, Style-Transfer, Image-Inpainting |
|Accuracy Configuration​|Required| Not Required| Not Required|


## <a name="dataset-annotations">Accuracy Evaluation on Validation Dataset</a>

Accuracy Evaluation on Validation Dataset report provides information for evaluating model quality and allows you to compare the model output and validation dataset annotations. This type of report is explained in details in the [Object Detection](Tutorial_object_detection_dataset.md) and [Classification](Tutorial_classification_dataset.md) model tutorials.

## <a name="model-predictions">Comparison of Optimized and Parent Model Predictions</a>

To get other types of Accuracy Report, you need to [optimize the model](Int-8_Quantization). Comparison of Optimized and Parent Model Predictions Report allows you to find out on which validation dataset images the predictions of the model became different after optimization. This type of report is explained in details in the  [Optimize Object Detection](Tutorial_object_detection.md) model and [Optimize Classification](Tutorial_classification.md) model tutorials.


## <a name="tensor-distance">Calculation of Tensor Distance to Parent Model Output</a>

Tensor Distance Calculation Report allows to evaluate the mean squared error (MSE) between Optimized and Parent models output on tensor level for each image in the validation dataset. Mean Squared Error (MSE) is an average of the square of the difference between actual and estimated values. MSE evaluation enables you to identify significant differences between Parent and Optimized model predictions for a wider set of use cases besides classification and object detection. This type of report is explained in details in the [Optimize Style Transfer](Tutorial_style_transfer.md) model tutorial.


---
## See Also

* [Object Detection model tutorial](Tutorial_object_detection_dataset.md)
* [Classification model tutorial](Tutorial_classification_dataset.md)
* [Optimize Object Detection model tutorial](Tutorial_object_detection.md)
* [Optimize Classification model tutorial](Tutorial_classification.md)
* [Optimize Style Transfer model tutorial](Tutorial_style_transfer.md)
* [Accuracy Checker](https://docs.openvinotoolkit.org/latest/omz_tools_accuracy_checker.html)
* [Configure Accuracy Settings](Accuracy_Configuration.md)
* [Troubleshooting](Troubleshooting.md)