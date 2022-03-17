import defusedxml.ElementTree as et
import os
import sys

WORKBENCH_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

if __name__ == '__main__':
    ideal_configurations_xml = os.path.join(WORKBENCH_ROOT, 'automation', 'bootstrap', 'pycharm_configurations.xml')
    current_configurations_xml = os.path.join(WORKBENCH_ROOT, '.idea', 'workspace.xml')
    ideal_configurations = et.parse(ideal_configurations_xml)
    current_configurations = et.parse(current_configurations_xml)
    for component in list(current_configurations.getroot()):
        if component.attrib['name'] == 'RunManager':
            for configuration in list(component):
                component.remove(configuration)
            for ideal_config in list(ideal_configurations.getroot()):
                component.append(ideal_config)
    current_configurations.write(current_configurations_xml)

    print('If you have HDDL, replace $LD_LIBRARY_PATH in all configurations to the new one'
          'after running source ~/intel/openvino_2022/setupvars.sh')

    if sys.platform == 'darwin':
        print('Congratulations, you have Mac Book. '
              'You need to make following edits in automation/bootstrap/pycharm_configurations.xml:')
        print(' 1. replace $LD_LIBRARY_PATH in all configurations to the new one '
              'after running source ~/intel/openvino_2022/setupvars.sh')
        print(' 2. change version of Python from 3.6 to 3.7 (if you have 3.7)')
        print(' 3. replace $USER_HOME$/intel/openvino_2022 with a particular version, '
              'for example $USER_HOME$/intel/openvino_2022.1.088')
        print('Then re-run this script and enjoy your journey through DL Workbench.')
