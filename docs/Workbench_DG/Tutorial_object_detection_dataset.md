# Object Detection Model Tutorial {#workbench_docs_Workbench_DG_Measure_Accuracy_Object_detection}

Accuracy measurement is an important stage of profiling your model in the DL Workbench. Along with performance, accuracy is crucial for assessing model quality. 

| Model  | Task Type | Framework | Source | Dataset |
| :---: | :---: | :---: | :---: |:---: |
| [ssd_mobilenet_v2_coco](https://docs.openvinotoolkit.org/latest/omz_models_model_ssd_mobilenet_v2_coco.html)  | [Object Detection](https://machinelearningmastery.com/object-recognition-with-deep-learning/) | [TensorFlow\*](https://www.tensorflow.org/) | [Open Model Zoo](https://github.com/openvinotoolkit/open_model_zoo/tree/master/models/public/mobilenet-ssd)| [2017 Val images](http://cocodataset.org) |

Refer to the [Get Started with DL Workbench](Work_with_Models_and_Sample_Datasets.md) to learn how to import the model and dataset. 

> **TIP**: If you have optimized the model using [INT8 Calibration](Int-8_Quantization.md), you can use a Not Annotated dataset to compare original and optimized model predictions. 

Once you select a model and a dataset and run a baseline inference, the **Projects** page appears. Go to the **Perform** tab and select **Create Accuracy Report**:

![](img/accuracy_report/create_report.png)

## Create Accuracy Evaluation on Validation Dataset Report

Accuracy Evaluation on Validation Dataset report provides information for evaluating model quality and allows you to compare the model output and validation dataset annotations. Select the report type and click **Provide Accuracy Configuration** button. Refer to the [Accuracy Configurations page](Accuracy_Configuration.md) to learn about different accuracy settings.

![](img/accuracy_report/Acc_Report_1.png)

After you click **Create Accuracy Report**, you will be redirected to the **Analyze** tab, where  you can check the status of Accuracy Report creation:

![](img/accuracy_report/creating_accuracy_report.png)

> **NOTE:** Accuracy measurements are performed on each dataset image. Creating an Accuracy Report may take some time if the dataset is considerably big. 

## Interpret Report Results 

Accuracy is measured on the validation dataset images. Each line of the table contains a specific class that the model predicted for the object in the image - **Class Predicted by Model**.  The number of detected objects of predicted class is represented in  **A. Model Detections of Predicted Class**. The number of objects that have the same class specified in the image annotations is indicated in **B. Objects of Predicted Class in Dataset Annotations**. If the numbers do not match, the model must be incorrect.

To assess the difference between model detections and dataset annotations, check **Matches between A and B**. Matches show the number of times the model detected the location of the object as specified in the validations dataset annotations.

![](img/accuracy_report/od_val_dataset_result.png)

> **TIP** : To sort the numbers from lowest to highest, click on the parameter name in the table.

Click **Visualize** button under the **Actions** column to compare the predictions and annotations for a particular image.

![](img/accuracy_report/od_visualize_true.png)

In our case, the `ssd_mobilenet_v2_coco` model detected 2 objects of class 23 (bear). These detections coincide with the dataset annotations: 2 objects of the same class as predicted by the model. The number of matches also equals 2. In the image, it is shown by almost identical bounding boxes for each object. 

![](img/accuracy_report/od_val_dataset_false.png)

Let's consider another example image. The model detected 3 objects of class 1 (person). The annotations indicate that the image contains 4 objects of this class. 2 matches show that only 2 of the 3 detected objects coincide with annotations. In the image, you can see that the model detected 3 people. While one person in the distance is detected precisely, the other bounding boxes are noticeably different from the annotation. Two other people are not detected by the model.

> **TIP**: You can enhance your model performance while ensuring that the model accuracy has not decreased dramatically. For that, [optimize your model](Int-8_Quantization.md) and create an Accuracy Report that allows you to visualize and [compare Optimized and Parent model predictions](Tutorial_object_detection.md). 

*All images were taken from ImageNet, Pascal Visual Object Classes, and Common Objects in Context datasets for demonstration purposes only.*


## See Also

* [Classification model tutorial](Tutorial_classification_dataset.md)
* [Optimize Object Detection model tutorial](Tutorial_object_detection.md)
* [Optimize Classification model tutorial](Tutorial_classification.md)
* [Optimize Style Transfer model tutorial](Tutorial_style_transfer.md)
* [Accuracy Checker](https://docs.openvinotoolkit.org/latest/omz_tools_accuracy_checker.html)
* [Configure Accuracy Settings](Accuracy_Configuration.md)
* [Troubleshooting](Troubleshooting.md)