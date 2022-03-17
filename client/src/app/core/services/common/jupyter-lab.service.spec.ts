import { TestBed } from '@angular/core/testing';

import { JupyterLabService } from '@core/services/common/jupyter-lab.service';

describe('JupyterLabService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [JupyterLabService],
    })
  );

  const jupyterLabTreeURLSlug = '/jupyter/lab/tree';

  it('should be created', () => {
    const service: JupyterLabService = TestBed.inject(JupyterLabService);
    expect(service).toBeTruthy();
  });

  it('should return valid file URL with query param', () => {
    const service: JupyterLabService = TestBed.inject(JupyterLabService);
    const filePath = 'notebook.ipynb';
    const fileURL = service.getFileUrl(filePath);
    const expectedURLPath = `${jupyterLabTreeURLSlug}/${filePath}?file-browser-path=${filePath}`;
    expect(fileURL).toContain(expectedURLPath);
  });

  it('should return valid intro URL', () => {
    const service: JupyterLabService = TestBed.inject(JupyterLabService);
    const expectedIntroURL = `${jupyterLabTreeURLSlug}/tutorials/intro.md`;
    expect(service.introURL).toContain(expectedIntroURL);
  });

  it('should return valid sample application tutorial URL', () => {
    const service: JupyterLabService = TestBed.inject(JupyterLabService);
    const expectedURL = `${jupyterLabTreeURLSlug}/tutorials/sample_application/tutorial_sample_application.ipynb`;
    expect(service.sampleApplicationTutorialURL).toContain(expectedURL);
  });

  it('should return valid tutorial URL for provided directory', () => {
    const service: JupyterLabService = TestBed.inject(JupyterLabService);
    const tutorialDirectory = 'classification';
    const tutorialURL = service.getTutorialURL(tutorialDirectory);
    const expectedURL = `${jupyterLabTreeURLSlug}/tutorials/${tutorialDirectory}/tutorial_${tutorialDirectory}.ipynb`;
    expect(tutorialURL).toContain(expectedURL);
  });

  it('should return valid tutorial URL for provided directory and file name', () => {
    const service: JupyterLabService = TestBed.inject(JupyterLabService);
    const tutorialDirectory = 'classification';
    const tutorialFileName = 'notebook.ipynb';
    const tutorialURL = service.getTutorialURL(tutorialDirectory, tutorialFileName);
    const expectedURL = `${jupyterLabTreeURLSlug}/tutorials/${tutorialDirectory}/${tutorialFileName}`;
    expect(tutorialURL).toContain(expectedURL);
  });

  it('should create valid links to openVINO notebooks', () => {
    const service: JupyterLabService = TestBed.inject(JupyterLabService);
    const openvinoNotebooksLinks = service.openvinoNotebooksLinks;
    for (const notebookLink of openvinoNotebooksLinks) {
      expect(notebookLink.name).toBeTruthy();
      expect(notebookLink.description).toBeTruthy();
      const expectedURL = `${jupyterLabTreeURLSlug}/tutorials/openvino_notebooks`;
      const expectedURLRegExp = new RegExp(`${expectedURL}\\/[\\w_-]+\\/${notebookLink.name}\\.ipynb`, 'g');
      expect(notebookLink.url).toMatch(expectedURLRegExp);
    }
  });
});
