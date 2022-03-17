import { Injectable } from '@angular/core';

import { Observable, BehaviorSubject } from 'rxjs';

@Injectable()
export class HelpChecklistService {
  private currentExpandedItemName: string = null;

  private expandedItemNameSubject$: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  get expandedItemName$(): Observable<string> {
    return this.expandedItemNameSubject$.asObservable();
  }

  expandItem(name: string): void {
    if (this.currentExpandedItemName !== name) {
      this.currentExpandedItemName = name;
      this.expandedItemNameSubject$.next(this.currentExpandedItemName);
    }
  }

  collapseItem(name: string): void {
    if (this.currentExpandedItemName === name) {
      this.currentExpandedItemName = null;
      this.expandedItemNameSubject$.next(this.currentExpandedItemName);
    }
  }
}
