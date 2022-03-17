# Work with Remote Targets {#workbench_docs_Workbench_DG_Remote_Profiling}

@sphinxdirective

.. toctree::
   :maxdepth: 1
   :hidden:
   
   workbench_docs_Workbench_DG_Profile_on_Remote_Machine
   workbench_docs_Workbench_DG_Setup_Remote_Target
   workbench_docs_Workbench_DG_Add_Remote_Target
   workbench_docs_Workbench_DG_Remote_Machines

@endsphinxdirective

DL Workbench can collect performance data not only on the machine on which you run it, but also on
other machines in your local network. This helps when you cannot run the DL Workbench on a machine
due to security or network issues or because it is impossible to install Docker. If this is the
case, run the DL Workbench on another machine and collect performance data on a remote machine in
your local network.

When connected to a remote machine, you can currently use a limited set of DL Workbench features: 

Feature| Supported
--|--
Single and group inference  | Yes<br> (HDDL plugin is not supported)
INT8 calibration | Yes
Accuracy measurements | No
Performance comparison between models on local and remote machines| Yes
Deployment package creation | No

Follow the steps below to profile your model on a remote target:
1. [Set up the target machine](Setup_Remote_Target.md)
2. [Register the remote target in the DL Workbench](Add_Remote_Target.md) 
3. [Profile on the remote machine](Profile_on_Remote_Machine.md) 

> **NOTE**: Working with machines in your local network is not available when you run the DL Workbench in the [Intel® DevCloud for the Edge](Start_DL_Workbench_in_DevCloud.md).


## See Also

* [Manipulate Remote Machines](Remote_Machines.md)
* [Set Up Remote Target](workbench_docs_Workbench_DG_Setup_Remote_Target.html)
* [Profile on a Remote Machine](Profile_on_Remote_Machine.md)
* [Troubleshooting](Troubleshooting.md)