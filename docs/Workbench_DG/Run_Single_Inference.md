# Run Inference {#workbench_docs_Workbench_DG_Run_Single_Inference}

## Run Single Inference 

@sphinxdirective
.. raw:: html

   <div id="switcher-single" class="switcher-anchor">Run Single Inference</div>
@endsphinxdirective


To trigger more inference jobs of an existing configuration, go to the **Perform** tab on
the **Projects** page and open the **Explore Inference Configurations** subtab. Select
**Single Inference**, specify the number of inferences per a stream and a batch, and click
**Execute**:

![](img/run_single_inference_1.png)

The process starts and you cannot proceed until it is done:
![](img/banner1-b.png)

Once the inference is completed, go to the **Analyze** tab.
The graph now indicates a point for the new inference experiment:
![](img/new_inference_experiment.png)

The table now also contains a row for the inference experiment:
![](img/inference_history.png)

### Autobenchmarking

During the baseline inference with Batch 1 Stream 1 configurations, DL Workbench runs another inference where the parameters are set automatically depending on the model topology to obtain near-optimal performance on the selected accelerator. While automatic selection typically provides near-optimal performance, experimenting with various Batch and Stream combinations might help you  accelerate performance even further.

![](img/autobenchmarking.png)


> **NOTE**: For details about inference processes, see the [OpenVINO™ Runtime documentation](@ref openvino_docs_OV_Runtime_User_Guide).

## Run Group Inference 

@sphinxdirective
.. raw:: html

   <div id="switcher-range" class="switcher-anchor"> Run Group Inference </div>
   
@endsphinxdirective

DL Workbench provides a graphical interface to find the optimal configuration of batches and parallel requests on a certain machine.

To run a range of inference streams, go to the **Perform** tab on the **Projects** page
and open the **Explore Inference Configurations** subtab. Select **Group Inference** and
click **Configure Group Inference**.
![](img/group_inference.png)

On the **Configure Group Inference** page, select combinations of stream and batch
parameters by clicking corresponding cells in the table. The cells you select are
indicated with the check mark. Dark cells represent previously executed inferences. You
can select them as well. 
![](img/configure_group_inference.png)

Click **Show Next 10 Columns and Rows** to expand the table:
![](img/show_next_10-b.png)

Select <b>Range 2<sup>0</sup>-2<sup>8</sup></b> to see batch values only as degrees of 2:
![](img/degrees_of_2.png)

The estimated execution time is displayed under the table:
![](img/group_inference_time.png)

A table with the inferences you selected is on the right:
![](img/selected_inferences.png)

Once you click **Execute**, the inference starts and you cannot proceed until it is done:
![](img/banner1-b.png)

Once the inference is completed, go to the **Analyze** tab. The table contains rows for
each inference with a certain batch/parallel request configuration, and the graph
indicates points corresponding to them:  

![](img/group_inference_results_01.png)

Right above the graph, you can specify maximum latency to find the optimal configuration
with the best throughput within the desired latency range. The point corresponding to this
configuration turns blue:

![](img/group_inference_results_02.png)

To view information about latency, throughput, batch, and parallel requests of a specific
job, hover your cursor over the corresponding point on the graph. Use **Expand** and **Collapse** buttons to change sizes of the chart and the table:

![](img/group_inference_results_03.png)

### Autobenchmarking

During the baseline inference with Batch 1 Stream 1 configurations, DL Workbench runs another inference where the parameters are set automatically depending on the model topology to obtain near-optimal performance on the selected accelerator. While automatic selection typically provides near-optimal performance, experimenting with various Batch and Stream combinations might help you  accelerate performance even further.

![](img/autobenchmarking.png)


> **NOTE**: For details about inference processes, see the [OpenVINO™ Runtime documentation](@ref openvino_docs_OV_Runtime_User_Guide). 

## See Also

* [View Inference Results](View_Inference_Results.md)
* [Benchmark Tool](@ref openvino_inference_engine_tools_benchmark_tool_README)
* [Troubleshooting](Troubleshooting.md)
