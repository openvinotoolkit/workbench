 # Obtain Datasets {#workbench_docs_Workbench_DG_Generate_Datasets}

@sphinxdirective

.. toctree::
   :maxdepth: 1
   :hidden:
   
   workbench_docs_Workbench_DG_Dataset_Types
      
@endsphinxdirective

Validation of the model is always performed against specific data combined into datasets. To obtain trustworthy results, a dataset must satisfy the following requirements:

- Format: the data should be compatible with the model domain (Computer Vision or Natural Language Processing).

- Content: a dataset must be representative. The data needs to be aligned with the model use case (for example, images of people for face detection).

- Size: a dataset should contain a sufficient number of items
(100+).

> **NOTE**: You can use [Datumaro](https://openvinotoolkit.github.io/datumaro/docs/) to make the process of creating your dataset easier. Datumaro is a free framework and CLI tool for building, transforming, and analyzing datasets and annotations. 

## Image Dataset

Image datasets can be either Annotated or Not Annotated:

- Not Annotated dataset contains only images and allows using
most of the DL Workbench features: measure performance,
optimize, and visualize the model, etc.

- Annotated dataset contains images and information about
what each image is showing. It expands the possibilities
of working with a model and allows measuring accuracy
and optimizing the model within a controllable accuracy drop. 

@sphinxdirective
.. dropdown:: Upload Not Annotated Dataset

   You can upload your images to create not annotated dataset. If you do not have enough images or want to enlarge the dataset, use augmentation methods to increase the size of a dataset by generating modified image copies. 

   On the **Create Project** page, go to **Select a Validation Dataset** tab and click **Import Image Dataset**:

   .. image:: _static/images/dataset_import.png

   You will see the **Create Dataset** page where you can add your own images and specify the dataset name:

   .. image:: _static/images/import_dataset_page.png

   After you click **Import**, you are redirected to the **Create Project** page where you can check the import status.

   .. image:: _static/images/dataset_selection.png
@endsphinxdirective

@sphinxdirective

.. dropdown:: Not Annotated Dataset Augmentation

   Apply different augmentation types to create variations of your images and improve the model performance. Extending your validation dataset also helps to avoid possible overfitting of a calibrated model. Augmentation methods include different image modifications, such as horizontal and vertical flips, random erase, noise injection, and color transformations. 

   **Horizontal Flip**

   Horizontal image flip means reversing the rows and columns of an image pixels horizontally. Usually it does not modify the object category. 

   .. image:: _static/images/horizontal_flip_closeup.png

   **Vertical Flip**

   Vertical image flip reverse the rows and columns of an image pixels vertically. It is recommended to use this method in the context of the selected image and model task to avoid recognition issues.

   .. image:: _static/images/vertical_flip.png

   **Random Erase**

   Random Erase randomly selects a rectangle section in the image and erases its pixels with random values. Note that this augmentation methon might randomly erase an object particularly important for your use case. It is recommended to use this method in the context of the selected image and model task.

   .. image:: _static/images//random_erase.png

   **Noise Injection**

   Noise Injection means injecting a matrix of random values. Noise Injection presents itself as random black and white pixels spread through the image. This method helps to avoid overfitting when you model concentrates on the image patterns that occur frequently but may not be useful. 

   .. image:: _static/images/noise_injection.png


  **Color Transformations**

   Color Transformations change brightness and contrast of the image. You can select one or several presets with changed parameters. The preset specifies whether the brightness of the augmented image will be lighter(+20%) or darker(-20%). Contrast is the degree to which light and dark colours in the image differ. You can make the constrast of the augmented image higher(+20%) or lower(-20%).

   .. image:: _static/images/color_transformations.png

   After clicking **Import**, you are redirected to the **Create Project** page where you can check the import status. To remove an imported dataset from the list, click the bin icon in the **Action** column.

   .. image:: _static/images/custom_dataset_imported.png

   *All images were taken from ImageNet, Pascal Visual Object Classes, and Common Objects in Context datasets for demonstration purposes only.*
@endsphinxdirective

@sphinxdirective
.. dropdown:: Upload Annotated Dataset

    **NOTE**: Sample datasets must consist of a small sampling of images and be in
    ImageNet, Pascal Visual Object Classes (Pascal VOC), Common Objects in Context
    (COCO), Common Semantic Segmentation, Labeled Faces in the Wild (LFW), Visual Geometry Group Face 2 (VGGFace2), Wider Face, Open Images
    or unannotated format. To learn more about
    the formats, refer to [Dataset Types](Dataset_Types.md).

   On the **Create Project** page, go to **Select a Validation Dataset** tab and click **Import Image Dataset**:

   .. image:: _static/images/dataset_import.png

   To import a new dataset, click **Upload Dataset** tab. 
   Upload a `.zip` or `.tar.gz` archive with your dataset and specify
   the **Dataset Name** and **Dataset Type**:

   .. image:: _static/images/import_annotated_dataset.png

   Click **Import**. You are  automatically directed back to the 
   datasets table, where you can see the status of the import and select a dataset by clicking on it:

   .. image:: _static/images/dataset_selection.png

@endsphinxdirective

## Text Dataset

A text dataset should be represented as a table in СSV/TSV format of at least two columns with Text and Label for Text Classification use case. Textual Entailment task requires a СSV table of three columns with Premise, Hypothesis, and Label. [HuggingFace’s datasets library](https://huggingface.co/datasets) provides access to different text datasets. 

@sphinxdirective
.. dropdown:: Upload Text Dataset

   1. Select the dataset file in СSV/TSV format. If you do not have a text dataset, download one of the files from the **Text Dataset Tip**. Or open a dataset from HuggingFace’s datasets library. Find **Update on GitHub** button and download a dataset from the repository.   

   2. Specify dataset name.

   3. Specify file encoding. If you see incorrect symbols in the **Raw Dataset Preview**, try to select another encoding.

   4. Select separator.  If the file is incorrectly split into columns, try to select another separator.

   5. Specify whether the file has header to exclude it from the dataset.

   6. Select the task type. 

      - Textual entailment is the task of deciding whether the meaning of the Hypothesis (second text) can be inferred from the Premise (first text). The entailment relation is specified by the Label. Use textual entailment pattern for classification tasks that require two texts as input.  Specify the number of the dataset columns that contain Premise, Hypothesis, and Label.

      - Text classification is the task of assigning a sentence or document an appropriate category (also called label or class). Specify the number of the dataset column that contains Text and Label for classification.

   .. image:: _static/images/text_dataset.png

   Click **Import** and proceed to create a project. 

@endsphinxdirective

## See Also

* [Dataset Types](Dataset_Types.md)
* [Cut Datasets](Download_and_Cut_Datasets.md)
* [Troubleshooting](Troubleshooting.md)