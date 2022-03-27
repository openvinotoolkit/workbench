# View Inference Results {#workbench_docs_Workbench_DG_View_Inference_Results}

## Inference Results

Once an initial inference has been run with your project, you can view performance results on the **Analyze** tab of the **Projects** page.

![](img/analyze_tab.png)

* Throughput/Latency graph
* Table with inferences

If there are ways to improve the performance of your model, the DL Workbench notifies you
in the **Analyze** tab: 
![](img/performance_improvement.png)

Clicking this button taken you to the bottom of the page with the detailed information on
what can be improved and what steps you should take to get the most possible performance of this project. 
![](img/precision_improvements.png)

Scroll down to the three tabs below: 
* <a href="#performance-summary">Performance Summary</a>
* <a href="#precision-level-performance">Precision-Level Performance</a>
* <a href="#kernel-level-performance">Kernel-Level Performance</a>

## <a name="performance-summary">Performance Summary Tab</a>

The tab contains the **Per-layer Accumulated Metrics** table and the **Execution Attributes**
field, which includes throughput, latency, batch, and streams values of the selected
inference. 
![](img/performance_summary_tab.png)

Click **Expand Table** to see the full **Per-layer Accumulated Metrics** table, which
provides information on execution time of each layer type as well as the number layers in
a certain precision. Layer types are arranged from the most to the least time taken. 
![](img/perlayer_metrics.png)

The table visually demonstrates the ratio of time taken by each layer type. Uncheck boxes
in the **Include to Distribution Chart** column to filter out certain layers. 
![](img/perlayer_metrics_filter.png)

## <a name="precision-level-performance">Precision-Level Performance Tab</a>

The tab contains the **Precision Distribution** table, **Precision Transitions Matrix**, and **Execution Attributes**.

The **Precision Distribution** table provides information on execution time of layers in
different precisions. 

![](img/precision_distribution.png)

The table visually demonstrates the ratio of time taken by each layer type. Uncheck boxes
in the **Include to Distribution Chart** column to filter out certain layers. 

![](img/precision_distribution_filter.png)

The **Precision Transitions Matrix** shows how inference precision changed during model
execution. For example, if the cell at the FP32 row and the FP16 column shows 8, this
means that eight times there was a pattern of an FP32 layer being followed by an FP16
layer.

![](img/precision_transitions.png)

## <a name="kernel-level-performance">Kernel-Level Performance Tab</a>

The **Kernel-Level Performance** tab includes the **Layers** table and model graphs. 
See [Visualize Model](Visualize_Model.md) for details.

The **Layers** table shows each layer of the executed graph of a model: 
![](img/layers_table/layer_table_00.png)

For each layer, the table displays the following parameters:
- Layer name
- Execution time
- Layer type
- Runtime precision
- Execution order

To see details about a layer:
1. Click the name of a layer. The layer gets highlighted on the **Runtime Graph** on the right.
2. Click **Details** next to the layer name on the **Runtime Graph**. The details appear
   on the right to the table and provide information about execution parameters, layer
   parameters, and fusing information in case the layer was fused in the runtime.

![](img/layers_table/layers_table_04.png)

> **TIP**: To download a `.csv` inference report for your model, click **Download Report**.

### Sort and Filter Layers

You can sort layers by layer name, execution time, and execution order (layer information)
by clicking the name of the corresponding column.

To filter layers, select a column and a filter in the boxes above the table. Some filters by 
the **Execution Order** and **Execution Time** columns require providing a numerical value in the 
box that is opened automatically:

![](img/layers_table/layers_table_02.png)

To filter by multiple columns, click **Add new filter** after you specify all the data for the
the current column. To remove a filter, click the red *remove* symbol on the left to it:

![](img/layers_table/layers_table_03.png)

> **NOTE**: The filters you select are applied simultaneously.

Once you configure the filters, press **Apply Filter**. To apply a different filter, press
**Clear Filter** and configure new filters.

![](img/layers_table/layers_table_05.png)



## See Also

* [Visualize Model Performance](Visualize_Model.md)
* [INT8 Calibration](Int-8_Quantization.md)
* [Troubleshooting](Troubleshooting.md)