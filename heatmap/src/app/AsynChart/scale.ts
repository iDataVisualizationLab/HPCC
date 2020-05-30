import * as d3 from 'd3';
export const ScaleType = {
  // Continuous - Quantitative
  LINEAR: 'linear',
  LOG: 'log',
  POW: 'pow',
  SQRT: 'sqrt',
  SYMLOG: 'symlog',

  IDENTITY: 'identity',
  SEQUENTIAL: 'sequential',

  // Continuous - Time
  TIME: 'time',
  UTC: 'utc',

  // Discretizing scales
  QUANTILE: 'quantile',
  QUANTIZE: 'quantize',
  THRESHOLD: 'threshold',
  BIN_ORDINAL: 'bin-ordinal',

  // Discrete scales
  CATEGORY: 'category',
  ORDINAL: 'ordinal',
  POINT: 'point',
  BAND: 'band'
} as const;

type ValueOf<T> = T[keyof T];
export type ScaleType = ValueOf<typeof ScaleType>;

export function scale(s: ScaleType) {
  return d3[`scale${s.toLocaleUpperCase}`]();
}
