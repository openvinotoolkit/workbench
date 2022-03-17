import { ProjectItemDTO, ProjectItem } from './project.model';
import { mockProjectItemDTOList } from './project-data.mock';


describe('Project Item Models Test Suite', () => {
  it('Project Item from Project Item DTO', () => {
    const projectItemDTO: ProjectItemDTO = mockProjectItemDTOList[0] as ProjectItemDTO;
    const projectItem: ProjectItem = new ProjectItem(projectItemDTO);
    const equalFields = [
      'id',
      'modelId',
      'modelName',
      'datasetId',
      'datasetName',
      'target',
      'parentId',
      'execInfo',
      'configParameters',
      'creationTimestamp',
      'status',
    ];
    equalFields.forEach((field) => {
      expect(projectItem[field]).toEqual(projectItemDTO[field]);
    });
    expect(projectItem.isExpanded).toBeTruthy();
    expect(projectItem.isVisible).toBeTruthy();
    expect(projectItem.children).toEqual([]);
    expect(projectItem.pathFromRoot).toEqual([]);
  });

});

