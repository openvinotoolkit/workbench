import { Frameworks, TestUtils } from './pages/test-utils';

describe('Pre-configuration stage: ', () => {
  const testUtils: TestUtils = new TestUtils();

  async function configurationTest(framework: Frameworks): Promise<void> {
    it(`Configuration for ${framework}`, async () => {
      await testUtils.installFramework(framework);
    });
  }

  function getStageFrameworks(): Frameworks[] {
    // TENSORFLOW,PYTORCH,CAFFE2
    const envFrameworks: string = process.env['FRAMEWORKS'];
    return envFrameworks
      .toUpperCase()
      .split(',')
      .map((frameworkName) => Frameworks[frameworkName]);
  }

  for (const framework of getStageFrameworks()) {
    configurationTest(framework);
  }

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
  });
});
