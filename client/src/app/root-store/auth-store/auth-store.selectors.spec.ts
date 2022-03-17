import * as fromAuthStore from './auth-store.reducer';
import { selectAuthStoreState } from './auth-store.selectors';

describe('AuthStore Selectors', () => {
  it('should select the feature state', () => {
    const initialState = {
      accessToken: null,
      jti: null,
    };

    const result = selectAuthStoreState({
      [fromAuthStore.authStoreFeatureKey]: initialState,
    });

    expect(result).toEqual(initialState);
  });
});
