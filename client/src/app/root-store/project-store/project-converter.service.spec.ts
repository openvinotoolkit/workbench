import { TestBed } from '@angular/core/testing';

import { keyBy } from 'lodash';

import { ProjectConverterService } from './project-converter.service';
import { mockProjectItemDTOList, mockProjectIds } from './project-data.mock';
import { optimizationJobNamesMap, OptimizationJobTypes, ProjectItem, ProjectItemDTO } from './project.model';

const projectIds = {
  id1: 1,
  id1_1: 2,
  id2: 3,
  id2_1: 4,
};

describe('ProjectConverterService', () => {
  let service: ProjectConverterService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProjectConverterService],
    });
    service = new ProjectConverterService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('#getAllLevelsDescendants should return all level children', () => {
    const itemsMap = {
      [projectIds.id1]: {
        id: projectIds.id1,
        children: [projectIds.id1_1],
      },
      [projectIds.id1_1]: {
        id: projectIds.id1_1,
        children: [],
      },
      [projectIds.id2]: {
        id: projectIds.id2,
        children: [projectIds.id2_1],
      },
      [projectIds.id2_1]: {
        id: projectIds.id2_1,
        children: [],
      },
    } as { [id: number]: ProjectItem };
    const idsList = [itemsMap[projectIds.id1], itemsMap[projectIds.id2]].map(({ id }) => id);
    const expectedResult = Object.keys(itemsMap).map(Number);
    const allLevelsDescendants = service.getAllLevelsDescendants(idsList, itemsMap);
    expect(allLevelsDescendants.sort()).toEqual(expectedResult.sort());
  });

  describe('#getItemsListFromDtoList', () => {
    it('should return empty list without input', () => {
      const projectItemList: ProjectItem[] = service.getItemsListFromDtoList([]);
      expect(projectItemList).toEqual([]);
    });

    it('should convert dto list to items list', () => {
      const projectItemList: ProjectItem[] = service.getItemsListFromDtoList(
        mockProjectItemDTOList as ProjectItemDTO[]
      );
      projectItemList.forEach((item) => {
        expect(item.modelName).not.toBeEmptyString();
        expect(item.datasetName).toBeNonEmptyString();
        expect(item.pathFromRoot).toBeArrayOfNumbers();
        expect(item.children).toBeArrayOfNumbers();
        expect(item.isExpanded).toBeTruthy();
        expect(item.isVisible).toBeTruthy();
      });
    });

    it('should append optimization names to model name for each level of nesting', () => {
      const projectItemList: ProjectItem[] = service.getItemsListFromDtoList(
        mockProjectItemDTOList as ProjectItemDTO[]
      );
      const projectMap = keyBy(projectItemList, 'id');

      const topLevelProject = projectMap[mockProjectIds.root0];
      const int8Project = projectMap[mockProjectIds.root0_A];
      const topLevelProjectItemDTO = mockProjectItemDTOList.find((dto) => dto.id === topLevelProject.id);

      const int8Name = optimizationJobNamesMap[OptimizationJobTypes.INT_8];

      expect(topLevelProjectItemDTO).toBeTruthy();
      expect(topLevelProject).toBeTruthy();
      expect(int8Project).toBeTruthy();

      expect(topLevelProject.modelName).toBe(topLevelProjectItemDTO.modelName);

      expect(int8Project.modelName).toBe([topLevelProjectItemDTO.modelName, int8Name].join(' - '));
    });
  });
});
