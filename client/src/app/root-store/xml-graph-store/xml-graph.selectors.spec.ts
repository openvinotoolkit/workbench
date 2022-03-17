import { ModelGraphType } from '@store/model-store/model.model';

import { XMLGraphStoreSelectors, XMLGraphStoreState } from './';

const mockXMLGraphState = {
  [ModelGraphType.ORIGINAL]: {
    id: 1,
    xmlContent: '<xml>1</xml>',
    isLoading: false,
    error: null,
  },
  [ModelGraphType.RUNTIME]: {
    id: 2,
    xmlContent: '<xml>2</xml>',
    isLoading: false,
    error: null,
  },
} as XMLGraphStoreState.State;

describe('XML Graph Selectors', () => {
  it('should select original graph state', () => {
    const result = mockXMLGraphState[ModelGraphType.ORIGINAL];
    expect(XMLGraphStoreSelectors.selectOriginalGraph.projector(mockXMLGraphState)).toEqual(result);
  });

  it('should select runtime graph state', () => {
    const result = mockXMLGraphState[ModelGraphType.RUNTIME];
    expect(XMLGraphStoreSelectors.selectRuntimeGraph.projector(mockXMLGraphState)).toEqual(result);
  });

  it('should select original graph id', () => {
    const result = mockXMLGraphState[ModelGraphType.ORIGINAL].id;
    expect(XMLGraphStoreSelectors.selectOriginalGraphId.projector(mockXMLGraphState[ModelGraphType.ORIGINAL])).toEqual(
      result
    );
  });

  it('should select runtime graph id', () => {
    const result = mockXMLGraphState[ModelGraphType.RUNTIME].id;
    expect(XMLGraphStoreSelectors.selectRuntimeGraphId.projector(mockXMLGraphState[ModelGraphType.RUNTIME])).toEqual(
      result
    );
  });
});
