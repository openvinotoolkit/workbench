import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MarkdownService } from '@shared/components/markdown-text/markdown.service';

import { MarkdownTextComponent } from './markdown-text.component';

@NgModule({
  imports: [CommonModule],
  declarations: [MarkdownTextComponent],
  providers: [MarkdownService],
  exports: [MarkdownTextComponent],
})
export class MarkdownTextModule {}
