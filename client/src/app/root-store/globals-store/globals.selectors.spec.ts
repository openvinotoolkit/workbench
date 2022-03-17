import { GlobalsStoreSelectors, GlobalsStoreState } from './';

const mockGlobalsState = {
  isRunning: false,
} as GlobalsStoreState.State;

describe('Globals Selectors', () => {
  it('should select isRunning', () => {
    const result = false;
    const actualRes = GlobalsStoreSelectors.selectLocalStateTaskIsRunning.projector(
      mockGlobalsState
    );
    expect(actualRes).toEqual(result);
  });
});
