import {
  ComponentFactoryResolver,
  Directive,
  Input,
  OnChanges,
  SimpleChanges,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';

import { random } from 'lodash';

import { RectangleComponent } from '@shared/components/rectangle/rectangle.component';

@Directive({
  selector: '[wbSkeleton]',
})
export class SkeletonDirective implements OnChanges {
  @Input('wbSkeleton') isLoading = false;

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('wbSkeletonRepeat') size = 1;
  @Input('wbSkeletonGap') gap: string = null;
  @Input('wbSkeletonWidth') width: string = null;
  @Input('wbSkeletonHeight') height: string = null;

  constructor(
    private readonly _templateRef: TemplateRef<unknown>,
    private readonly _viewContainerRef: ViewContainerRef,
    private readonly _componentFactoryResolver: ComponentFactoryResolver
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.isLoading) {
      return;
    }
    this._viewContainerRef.clear();

    if (changes.isLoading.currentValue) {
      Array.from({ length: this.size }).forEach((_, index, array) => {
        const rectangleComponentFactory = this._componentFactoryResolver.resolveComponentFactory(RectangleComponent);
        const rectangleComponentRef = this._viewContainerRef.createComponent(rectangleComponentFactory);

        rectangleComponentRef.instance.width = this.width === 'rand' ? `${random(30, 90)}%` : this.width;
        rectangleComponentRef.instance.height = this.height;
        if (index !== array.length - 1) {
          rectangleComponentRef.instance.gap = this.gap;
        }
      });
    } else {
      this._viewContainerRef.createEmbeddedView(this._templateRef);
    }
  }
}
