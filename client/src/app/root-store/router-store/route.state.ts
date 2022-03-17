import { Params } from '@angular/router';

import { RouterReducerState } from '@ngrx/router-store';

export interface Route {
  url: string;
  queryParams: Params;
  params: Params;
}

export const initialState: RouterReducerState<Route> = {
  state: {
    url: '/',
    queryParams: {},
    params: {},
  },
  navigationId: 0,
};

export type MergedRouteReducerState = RouterReducerState<Route>;
