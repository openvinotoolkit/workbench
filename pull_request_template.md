## OpenVINO Deep Learning Workbench Pull Request

### All Submissions:
* [ ] Create a meaningful name of the PR with reference to JIRA. Example: *[43714] [NIGHTLY] Take correct tag for snyk scans*
* [ ] JIRA tickets:
  * 44177 - Model analyzer fails with topology type guessing
* [ ] Set assignee to the PR.
* [ ] Add corresponding labels to the PR. 
* [ ] Set appropriate milestone to the PR.
* [ ] Added tests for new functionality (unit / e2e)
* [ ] Followed code style guidelines:
  * Code covered with typings
  * No debug printing in production code
  * No commented blocks of code in production code

### Submissions with migration changes:
> **REMOVE SECTION IF NOT APPLICABLE**
* [ ] Check that workbench still works after the update from the previous version


### Submissions with dependencies changes:
> **REMOVE SECTION IF NOT APPLICABLE**
* [ ] Communicated to IP plan owner with the list of new **production** dependencies
* [ ] Ensure all dependencies versions are **frozen** (including development dependencies)
* [ ] Updated dependencies in `dependencies/edge_node_setup.py`. Ask artyomtugaryov or akashchi for more details.

### Submissions with Netron-related changes:
> **REMOVE SECTION IF NOT APPLICABLE**

* [ ] Run `npm run init-netron` from the `client` directory to check copying Netron sources
* [ ] Checked integration with latest Netron version on Ubuntu:
  * Delete `node_modules` directory
  * Install node modules (run `npm i`)
  * Run script for copying Netron sources (run `npm run init-netron` from the `client` directory)
* [ ] Checked integration with latest Netron version on Windows
* [ ] Check topologies visualization (both original and runtime graphs) with latest Netron in WB UI:
  * squeezenet
  * mobilenet-ssd
  * semantic-segmentation-adas


### Submissions that contain model-analyzer changes:
> **REMOVE SECTION IF NOT APPLICABLE**
* [ ] PR in model-analyzer repository: openvinotoolkit/model_analyzer# .

### Submissions that contain update of the OpenVINO package and image:
> **REMOVE SECTION IF NOT APPLICABLE**
* [ ] PR name should be special.\
       Template: 
       ```[Issue Number for Transition] Transition to the new package (<package number>, <WW>.<day number>`<YY>[, RC#(number of release candidate])```.\
       Example: ```[CI] Transition to the new package (#170, ww49.5`20, RC#2)```
* [ ] Updated `openvino_image` in `openvino_version.yml` in the private CI repository
* [ ] Updated dependencies in `dependencies/edge_node_setup.py`. Ask artyomtugaryov or akashchi for more details.
* [ ] Status of pre-commit pipeline: **FILL HERE**.\
      Example: `GREEN`.
* [ ] Status of custom deployment pipeline: **FILL HERE**.\
      Example: `GREEN`. Custom deployment does not happen automatically.\
      Therefore, there is a need to trigger it manually. Ask SalnikovIgor or akashchi for more details.
* [ ] Link to the matching PR in model-analyzer repository: openvinotoolkit/model_analyzer# .
* [ ] Status of model-analyzer pipeline: **FILL HERE**.\
      Example: `GREEN`.
      

> **NOTES**: 
> * To mark the item as done, add `x` to the empty `[ ]`, so that
>   you get `[x]` for items that you have done.  
>   Ignore items that are not relevant to your PR.
>
> * To add link, add `[Describing text](http://some-link)`.
>
> * Fill the checklist when creating the PR. Pull Requests that are not properly formatted **will not be reviewed**.
>
> * PRs with `WIP` label are not reviewed by default unless explicitly requested.
>
> * To learn more about GitHub markdown rules, refer to 
>   [documentation](https://docs.github.com/en/free-pro-team@latest/github/writing-on-github/basic-writing-and-formatting-syntax)

### Glossary

**Assignee** - Assignee is the single person whose review you **require**. Feel free as many reviewers
     to the PR. Reviewer is a person who will benefit from being aware of the proposed changes
     or whose opinion you want to know. **Rule: keep single assignee**.

**JIRA ticket**. At least one ticket that current PR addresses. Do not include project code. For example: *12345*.

### Available commands in pull request comments

1. `/bump:client` - bump to latest **master** branch in **client** submodule
1. `/bump:client:releases/2021/4` - bump to latest **releases/2021/4** branch in **client** submodule
1. `/bump:client:yatarkan:feature/yt/feature-name` - bump to latest **feature/yt/feature-name** branch from **yatarkan** remote fork in **client** submodule
1. `/update` - merge base (target) branch into target branch and push changes

> **NOTE**:
> For more details, please visit the [DEVELOPER.md](development/docs/DEVELOPER.md)
