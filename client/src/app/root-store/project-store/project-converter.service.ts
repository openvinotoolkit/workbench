import { Injectable } from '@angular/core';

import { keyBy, isEmpty, mapValues, get, tail, compact } from 'lodash';

import { optimizationJobNamesMap, ProjectItem, ProjectItemDTO } from './project.model';

@Injectable()
export class ProjectConverterService {
  getItemsListFromDtoList(dtoList: ProjectItemDTO[]): ProjectItem[] {
    if (isEmpty(dtoList)) {
      return [];
    }
    const dtoItemsDictionary = keyBy<ProjectItemDTO>(dtoList, 'id');
    const idToChildrenMap: { [id: number]: number[] } = mapValues(dtoItemsDictionary, () => []);
    const itemsList: ProjectItem[] = dtoList.map((dtoItem) => {
      const { id, parentId, modelId, modelName } = dtoItem;
      const pathFromRoot = this.getPathToRoot(id, dtoItemsDictionary).reverse();

      if (parentId) {
        idToChildrenMap[parentId].push(id);
      }

      const originalModelId = parentId ? get(dtoItemsDictionary, [pathFromRoot[0], 'modelId']) : modelId;

      const previousOptimizationNames = compact(
        tail([...pathFromRoot, id]).map((parentProjectId) => {
          const parentItem = dtoItemsDictionary[parentProjectId];
          return optimizationJobNamesMap[parentItem.configParameters.optimizationType];
        })
      );
      const modelNameWithOptimization = isEmpty(previousOptimizationNames)
        ? null
        : [modelName, ...previousOptimizationNames].join(' - ');

      return new ProjectItem(dtoItem, pathFromRoot, originalModelId, modelNameWithOptimization);
    });

    itemsList.forEach(({ id }, i) => {
      const childrenForItem = idToChildrenMap[id];
      if (!isEmpty(childrenForItem)) {
        itemsList[i].children = childrenForItem;
      }
    });

    return itemsList;
  }

  getAllLevelsDescendants(idsList: number[], itemsMap: { [id: number]: ProjectItem }): number[] {
    const allChildren = [...idsList];
    idsList.forEach((childId) => {
      const { children } = itemsMap[childId];
      if (!isEmpty(children)) {
        allChildren.push(...this.getAllLevelsDescendants(children, itemsMap));
      }
    });
    return allChildren;
  }

  private getPathToRoot(id: number, itemsMap: { [id: number]: ProjectItemDTO }): number[] {
    const pathArray = [];
    const { parentId } = itemsMap[id];
    if (parentId) {
      pathArray.push(parentId);
      pathArray.push(...this.getPathToRoot(parentId, itemsMap));
    }
    return pathArray;
  }
}
