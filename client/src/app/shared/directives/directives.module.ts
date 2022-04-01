import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ExternalLinkDirective } from './external-link.directive';
import { ScrollIntoViewDirective } from './scroll-into-view.directive';
import { MatTabGroupFixDirective } from './mat-tab-group-fix.directive';
import { DropAreaDirective } from './drop-area.directive';
import { SkeletonDirective } from './skeleton.directive';

@NgModule({
  declarations: [
    ExternalLinkDirective,
    ScrollIntoViewDirective,
    MatTabGroupFixDirective,
    DropAreaDirective,
    SkeletonDirective,
  ],
  imports: [CommonModule],
  exports: [
    ExternalLinkDirective,
    ScrollIntoViewDirective,
    MatTabGroupFixDirective,
    DropAreaDirective,
    SkeletonDirective,
  ],
})
export class DirectivesModule {}
