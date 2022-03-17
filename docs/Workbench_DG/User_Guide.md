# OpenVINO™ Deep Learning Workbench User Guide {#workbench_docs_Workbench_DG_User_Guide}

@sphinxdirective

.. toctree::
   :maxdepth: 1
   :hidden:
   
   workbench_docs_Workbench_DG_Select_Models
   workbench_docs_Workbench_DG_Generate_Datasets
   workbench_docs_Workbench_DG_Select_Environment
   Optimize Model Performance <workbench_docs_Workbench_DG_Int_8_Quantization>
   Explore Inference Configurations <workbench_docs_Workbench_DG_Run_Inference>
   Visualize Model Output <workbench_docs_Workbench_DG_Visualize_Accuracy>
   workbench_docs_Workbench_DG_Measure_Accuracy
   Create Deployment Package <workbench_docs_Workbench_DG_Deployment_Package>
   workbench_docs_Workbench_DG_Export_Project
   Learn OpenVINO in DL Workbench <workbench_docs_Workbench_DG_Jupyter_Notebooks_CLI>
   Maintain DL Workbench <workbench_docs_Workbench_DG_Persist_Database>
      
@endsphinxdirective

The purpose of this User Guide is to give you instructions on every step of the DL Workbench workflow.

For information on how to start working with DL Workbench, refer to the [Get Started](Work_with_Models_and_Sample_Datasets.md) documentation. 


1. [Obtain Models](Select_Models.md)

    Import original and Open Model Zoo models and convert them to Intermediate Representation format. 

2. [Obtain Datasets](Import_Datasets.md)

   Create and import annotated datasets of different supported formats, upload not annotated dataset, and enlarge datasets using augmentation.

3. [Configure Environment](Select_Environment.md) and [Work with Remote Targets](Remote_Profiling.md)

    Select a target and device.

4. [Optimize Model Performance](Int-8_Quantization.md)

   Accelerate model performance with INT8 Calibration.

5. [Explore Inference Configurations](Run_Single_Inference.md)

   Run single or group inference, try different batch and stream combinations to accelerate the performance, visualize model architecture and compare model projects.

6. [Create Accuracy Report](Measure_Accuracy.md)

   Measure the accuracy of a model and compare the predictions with the dataset annotations or between optimized and parent models. 

7. [Create Deployment Package](Deployment_Package.md)

   Build your application with Deployment Package and learn how to use batches and streams in your application. 

8. [Export Project](Export_Project.md)

   Download an archive with artifacts of your project.

9. [Explore OpenVINO in DL Workbench](Jupyter_Notebooks_CLI.md)

   Quick start with the OpenVINO™ toolkit and learn how to use its API and command-line interface (CLI) in the preconfigured environment.

10. [Maintain DL Workbench](Persist_Database.md)

   Restore and preserve DL Workbench state and explore options of working with Docker* container.