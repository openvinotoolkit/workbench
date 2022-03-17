import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { DirectivesModule } from '@shared/directives/directives.module';

import { MarkdownTextComponent } from './markdown-text.component';

@NgModule({
  imports: [CommonModule, RouterModule, DirectivesModule],
  declarations: [MarkdownTextComponent],
  exports: [MarkdownTextComponent],
})
export class MarkdownTextModule {}
