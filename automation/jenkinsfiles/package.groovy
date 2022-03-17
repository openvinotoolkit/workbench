@Library(['workbench_lib', 'mainlib@0.1.0']) _
import java.text.SimpleDateFormat

properties([
    parameters([
        string(
            trim: true,
            defaultValue: '',
            description: 'OpenVINO image',
            name: 'ov_image'),
        string(
            trim: true,
            defaultValue: '',
            description: 'OpenVINO package',
            name: 'ov_package'),
        string(
            trim: true,
            defaultValue: 'master',
            description: 'Target branch',
            name: 'targetBranch'),
        string(
            trim: true,
            defaultValue: 'https://github.com/openvinotoolkit/workbench.git',
            description: 'Target repository',
            name: 'targetRepository'),
    ])
])

node(env.node) {
    try {
        timestamps {
            workbenchPackage()
        }
        currentBuild.result = "SUCCESS"
    } catch(org.jenkinsci.plugins.workflow.steps.FlowInterruptedException e) {
        currentBuild.result = "ABORTED"
    } catch(e) {
        println e
        currentBuild.result = "FAILURE"
    }
}
