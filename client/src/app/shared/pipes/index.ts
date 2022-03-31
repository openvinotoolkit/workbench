import { EstimatedTimePipe } from '@shared/pipes/estimated-time.pipe';
import { SingleInferenceStatusPipe } from '@shared/pipes/inference-status/single-inference-status.pipe';
import { ProfilingStatusPipe } from '@shared/pipes/inference-status/profiling-status.pipe';
import { CutNumberPipe } from '@shared/pipes/cut-number.pipe';
import { SafeUrlPipe } from '@shared/pipes/safe-resource.pipe';
import { FormatNumberPipe } from '@shared/pipes/format-number.pipe';

import { LinkifyPipe } from './linkify.pipe';
import { MultiLineTextPipe } from './multiline-text.pipe';
import { CallFunctionPipe } from './call-function.pipe';

export const pipes = [
  LinkifyPipe,
  MultiLineTextPipe,
  EstimatedTimePipe,
  SingleInferenceStatusPipe,
  ProfilingStatusPipe,
  CutNumberPipe,
  SafeUrlPipe,
  FormatNumberPipe,
  CallFunctionPipe,
];

export * from './linkify.pipe';
export * from './multiline-text.pipe';
export * from './call-function.pipe';
