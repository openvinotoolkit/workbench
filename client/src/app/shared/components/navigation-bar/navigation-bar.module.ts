import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { BreadcrumbsComponent } from '@shared/components/breadcrumbs/breadcrumbs.component';
import { NavigationBarComponent } from '@shared/components/navigation-bar/navigation-bar.component';
import { MaterialModule } from '@shared/material.module';
import { MarkdownTextModule } from '@shared/components/markdown-text/markdown-text.module';

@NgModule({
  imports: [RouterModule, CommonModule, MaterialModule, MarkdownTextModule],
  declarations: [BreadcrumbsComponent, NavigationBarComponent],
  exports: [BreadcrumbsComponent, NavigationBarComponent],
})
export class NavigationBarModule {}
