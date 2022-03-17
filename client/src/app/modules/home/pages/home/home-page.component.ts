import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import { MessagesService } from '@core/services/common/messages.service';

import { ModelStoreActions, ModelStoreSelectors, RootStoreState } from '@store';
import { ModelItem } from '@store/model-store/model.model';
import { ProjectStatusNames } from '@store/project-store/project.model';

@Component({
  selector: 'wb-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
})
export class HomePageComponent implements OnDestroy {
  public modelItems$: Observable<ModelItem[]> = this.store$
    .select(ModelStoreSelectors.selectAllModels)
    .pipe(
      map((models) =>
        models.filter(({ status, isConfigured }) => status.name === ProjectStatusNames.READY && isConfigured)
      )
    );
  private unsubscribe$ = new Subject<void>();

  public readonly createProjectHint = this.messagesService.hintMessages.homePageHints.createProject;
  public readonly exploreOmzHint = this.messagesService.hintMessages.homePageHints.exploreOMZ;

  public displayType: 'list' | 'grid' = 'grid';

  constructor(
    private store$: Store<RootStoreState.State>,
    private router: Router,
    private messagesService: MessagesService
  ) {
    this.store$.dispatch(ModelStoreActions.loadModels());
  }

  handleOpenModel({ id }: ModelItem): void {
    this.router.navigate(['/models', id]);
  }

  goToCreateProject(): void {
    this.router.navigate(['/projects']);
  }

  goToImportModel(): void {
    this.router.navigate(['/model-manager/import']);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
