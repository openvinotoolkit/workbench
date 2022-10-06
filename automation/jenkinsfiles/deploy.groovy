@Library(['workbench_lib@fix/pipeline-settings', 'mainlib@master']) _
import java.text.SimpleDateFormat


properties([
    parameters([
        string(
            trim: true,
            defaultValue: '',
            description: 'Branch in DL Workbench repo',
            name: 'branch'),
        string(
            trim: true,
            defaultValue: '',
            description: 'Deploy port number',
            name: 'port'),
        string(
            trim: true,
            defaultValue: '',
            description: 'Name or label of the node to run deploy on',
            name: 'node'),
        string(
            trim: true,
            defaultValue: '',
            description: 'Run scope (for nightly use e2e:nightly)',
            name: 'scope'),
        booleanParam(
            defaultValue: false,
            description: 'Push the docker image to (private) docker hub',
            name: 'push_to_docker_hub'),
        string(
            trim: true,
            defaultValue: '',
            description: 'OpenVINO image to build DL WB upon',
            name: 'ov_image'),
    ])
])


try {
    timestamps {
        workbenchPostCommit()
    }
    currentBuild.result = "SUCCESS"
} catch(org.jenkinsci.plugins.workflow.steps.FlowInterruptedException e) {
    currentBuild.result = "ABORTED"
} catch(e) {
    println e
    currentBuild.result = "FAILURE"
} finally {
    // write down time when build starts
    def dateFormat = new SimpleDateFormat("MM/dd/yyyy hh:mm")
    def date = new Date()
    def datestr = dateFormat.format(date)

    // Pipeline information
    def is_master_or_release = env.branch.equals("master") || env.branch.contains("releases/20")
    def is_nightly = params.scope.contains('e2e:nightly')
    def do_docker_push_to_hub = (params.push_to_docker_hub || is_master_or_release) && (!is_nightly)

    def email_body = """
    <p>Branch name: ${env.branch}</p>
    <p>Build status: ${currentBuild.result}</p>
    <p>Triggered by: ${env.AUTHOR}</p>
    <p>Commit message: ${env.MESSAGE}</p>
    <p>Host: ${env.deploy_hostname}</p>
    <p>Port: ${env.port}</p>
    <p><a href='${BUILD_URL}/console'>Build log in Jenkins</a></p>
    <p><a href='${BUILD_URL}/dl-workbench-deploy-e2e-results'>Full report in Jenkins</a></p>
    ${env.REPORT_CONTENT}
    """

    if (do_docker_push_to_hub) {
      email_body += """
    <p>Docker images pushed to https://hub.docker.com/repository/docker/openvino/workbench_private
    <br>For use this docker images use following commands:
    <br>docker pull ${env.private_docker_hub}:${env.VERSION}
    </p>
      """
    }

    if (env.fe_npm_audit_vulnerability) {
        email_body += """
      <p>WARNING: There are vulnerabilities in client. No fix is available yet.</p>
      """
    }


    if (is_master_or_release) {
        recipients = env.recipients
        emailext (
            to: recipients.join(','),
            subject: "Workbench E2E. ${currentBuild.result}. Branch: ${env.branch}. ${datestr}",
            body: email_body,
        )
    }
}
