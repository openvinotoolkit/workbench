import os
import subprocess
import unittest
import time


class TestNpmAudit(unittest.TestCase):
    def test_npm_audit(self):
        """Fail if there are vulnerabilities that can be fixed with `npm audit fix`."""
        package = os.path.basename(os.getcwd())
        print('Checking ./{}'.format(package), flush=True)
        for iteration in range(5):
            first_audit_result = subprocess.run(['npm', 'audit'], stderr=subprocess.PIPE)
            if b'ENOAUDIT' in first_audit_result.stderr or b'EAI_AGAIN' in first_audit_result.stderr:
                time.sleep(60)
                continue
            else:
                break
        if first_audit_result.returncode:
            print('Vulnerabilities found in ./{}. '.format(package))
            subprocess.run(['npm', 'audit', 'fix'])
            second_audit_result = subprocess.run(['npm', 'audit'])
            if second_audit_result.returncode:
                print('There is no fix yet.')
            else:
                raise AssertionError('Fix is available, run `cd $workbench/{}; npm audit fix` to install.'.format(package))
