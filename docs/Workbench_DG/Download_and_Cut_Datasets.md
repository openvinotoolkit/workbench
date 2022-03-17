# Cut Datasets {#workbench_docs_Workbench_DG_Download_and_Cut_Datasets}

Original datasets are considerably big in size. If you want to save your time when loading
original datasets into the DL Workbench, cut them as described in the following sections.

- <a href="#imagenet">ImageNet</a>
- <a href="#voc">Pascal Visual Object Classes (Pascal VOC)</a>
- <a href="#coco">Common Objects in Context (COCO)</a>

To learn more about dataset types supported by the DL Workbench, their structure, and how
to download them, refer to [Dataset Types](Dataset_Types.md).

## <a name="imagenet">ImageNet Dataset</a>

### Cut ImageNet Dataset

1. Save [the script to cut datatsets](https://raw.githubusercontent.com/aalborov/cut_dataset/38c6dd3948ce4084a52c66e2e83c63eb3fa883e9/cut_dataset.py) to the following directory:
    * Linux\*, macOS\*: `/home/<user>/Work`. Replace `<user>` with your username.
    * **Windows\***: `C:\Work`

2. Put the [downloaded dataset](Dataset_Types.md) in the same directory.

3. Follow instructions for your operating system.

> **NOTE**: Replace `<user>` with your username. Run the following command in a terminal for Linux, macOS and in the Windows PowerShell* for Windows.

@sphinxdirective
   
.. tab:: Linux, macOS
   
  .. code-block:: 
   
    python /home/<user>/Work/cut_dataset.py \
      --source_archive_dir=/home/<user>/Work/imagenet.zip \
       --output_size=20 \
       --output_archive_dir=/home/<user>/Work/subsets \
      --dataset_type=imagenet \
      --first_image=10


.. tab:: Windows
      
  .. code-block:: 


    python C:\\Work\\cut_dataset.py `
       --source_archive_dir=C:\\Work\\imagenet.zip `
       --output_size=20 `
       --output_archive_dir=C:\\Work\\subsets `
      --dataset_type=imagenet `
      --first_image=10

   
@endsphinxdirective

This command runs the script with the following arguments:

 Parameter  |  Explanation
    --|--
    `--source_archive_dir`  |  Full path to a downloaded archive
    `--output_size=20` |  Number of images to be left in a smaller dataset
    `--output_archive_dir` | Full directory to the smaller dataset, excluding the name
    `--dataset_type`| Type of the source dataset
    `--first_image`| *Optional*. The index of the image to start cutting from. Specify if you want to split your dataset into training and validation subsets. The default value is 0.


## <a name="voc"> Pascal Visual Object Classes (VOC) Dataset</a>

### Cut Pascal VOC Dataset

1. Save [the script to cut datatsets](https://raw.githubusercontent.com/aalborov/cut_dataset/38c6dd3948ce4084a52c66e2e83c63eb3fa883e9/cut_dataset.py) to the following directory:
    * Linux\*, macOS\*: `/home/<user>/Work`. Replace `<user>` with your username.
    * **Windows\***: `C:\Work`

2. Put the [downloaded dataset](Dataset_Types.md) in the same directory.

3. Follow instructions for your operating system.

> **NOTE**: Replace `<user>` with your username. Run the following command in a terminal for Linux, macOS and in the Windows PowerShell* for Windows.

@sphinxdirective
   
.. tab:: Linux, macOS
   
  .. code-block:: 
   
   
   python /home/<user>/Work/cut_dataset.py \
       --source_archive_dir=/home/<user>/Work/voc.tar.gz \
       --output_size=20 \
       --output_archive_dir=/home/<user>/Work/subsets \
       --dataset_type=voc \
       --first_image=10
   

.. tab:: Windows
      
  .. code-block:: 
  
   python C:\\Work\\cut_dataset.py `
       --source_archive_dir=C:\\Work\\voc.tar.gz `
       --output_size=20 `
       --output_archive_dir=C:\\Work\\subsets `
       --dataset_type=voc `
       --first_image=10
   

@endsphinxdirective


This command runs the script with the following arguments:

Parameter  |  Explanation
    --|--
    `--source_archive_dir`  |  Full path to a downloaded archive
    `--output_size=20` |  Number of images to be left in a smaller dataset
    `--output_archive_dir` | Full directory to the smaller dataset, excluding the name
    `--dataset_type`| Type of the source dataset
    `--first_image`| *Optional*. The index of the image to start cutting from. Specify if you want to split your dataset into training and validation subsets. The default value is 0.


## <a name="coco">Common Objects in Context (COCO) Dataset</a>

### Cut COCO Dataset

1. Save [the script to cut datatsets](https://raw.githubusercontent.com/aalborov/cut_dataset/38c6dd3948ce4084a52c66e2e83c63eb3fa883e9/cut_dataset.py) to the following directory:
    * Linux\*, macOS\*: `/home/<user>/Work`. Replace `<user>` with your username.
    > **NOTE**: Replace `<user>` with your username.
    * **Windows\***: `C:\Work`

2. Put the [downloaded archives](Dataset_Types.md) in the same directory.

3. Follow instructions for your operating system.

> **NOTE**: Replace `<user>` with your username. Run the following command in a terminal for Linux, macOS and in the Windows PowerShell* for Windows.

@sphinxdirective
   
.. tab:: Linux, macOS
   
  .. code-block:: 
   
  
   python /home/<user>/Work/cut_dataset.py \
       --source_images_archive_dir=/home/<user>/Work/coco_images.zip \
       --source_annotations_archive_dir=/home/<user>/Work/coco_annotations_.zip \
       --output_size=20 \
       --output_archive_dir=/home/<user>/Work/subsets \
       --dataset_type=coco \
       --first_image=10
  
.. tab:: Windows
      
  .. code-block:: 

   python C:\\Work\\cut_dataset.py `
       --source_images_archive_dir=C:\\Work\\coco_images.zip `
       --source_annotations_archive_dir=C:\\Work\\coco_annotations_.zip `
       --output_size=20 `
       --output_archive_dir=C:\\Work\\subsets `
       --dataset_type=coco `
       --first_image=10


@endsphinxdirective
 
This command runs the script with the following arguments:

Parameter  |  Explanation
    --|--
    `--source_images_archive_dir` |  Full path to the downloaded archive with images, including the name
    `--source_annotations_archive_dir` |  Full path to the downloaded archive with annotations, including the name
    `--output_size` |  Number of images to be left in a smaller dataset
    `--output_archive_dir` | Full directory to the smaller dataset excluding the name
    `--dataset_type`| Type of the source dataset
    `--first_image`| *Optional*. The number of the image to start cutting from. Specify if you want to split your dataset into training and validation subsets. The default value is 0.

---
## See Also

* [Dataset Types](Dataset_Types.md)
* [Import Datasets](Import_Datasets.md)
* [Troubleshooting](Troubleshooting.md)