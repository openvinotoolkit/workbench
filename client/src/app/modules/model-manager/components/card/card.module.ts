import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import {
  CardComponent,
  CardTitleRowComponent,
  CardContentRowComponent,
  CardContentRowItemComponent,
} from './card.component';

@NgModule({
  imports: [CommonModule],
  declarations: [CardComponent, CardTitleRowComponent, CardContentRowComponent, CardContentRowItemComponent],
  exports: [CardComponent, CardTitleRowComponent, CardContentRowComponent, CardContentRowItemComponent],
})
export class CardModule {}
