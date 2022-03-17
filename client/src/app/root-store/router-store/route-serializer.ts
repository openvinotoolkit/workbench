import { Params, RouterStateSnapshot } from '@angular/router';

import { RouterStateSerializer } from '@ngrx/router-store';

import { Route } from './route.state';

export class MergedRouterStateSerializer implements RouterStateSerializer<Route> {
  serialize(routerState: RouterStateSnapshot): Route {
    let route = routerState.root;
    let params: Params = { ...route.params };

    while (route.firstChild) {
      route = route.firstChild;
      params = { ...params, ...route.params };
    }

    const {
      url,
      root: { queryParams },
    } = routerState;

    return { url, params, queryParams };
  }
}
