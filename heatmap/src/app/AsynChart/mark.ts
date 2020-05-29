// Inspried by Vega-Lite
import * as _ from 'lodash';
/**
 * All types of primitive marks.
 */
export const Mark = {
  arc: 'arc',
  area: 'area',
  bar: 'bar',
  image: 'image',
  line: 'line',
  point: 'point',
  rect: 'rect',
  rule: 'rule',
  text: 'text',
  tick: 'tick',
  trail: 'trail',
  circle: 'circle',
  square: 'square',
} as const;

export const AREA = Mark.area;
export const BAR = Mark.bar;
export const LINE = Mark.line;
export const POINT = Mark.point;
export const RECT = Mark.rect;

export type Mark = keyof typeof Mark;
export function isMark(m: string): m is Mark {
  return m in Mark;
}

export function isPathMark(m: Mark ): m is 'line' | 'area' | 'trail' {
  return _.includes(['line', 'area', 'trail'], m);
}

export function isRectBasedMark(m: Mark ): m is 'rect' | 'bar' | 'image' | 'arc' {
  return _.includes(['rect', 'bar', 'image', 'arc' /* arc is rect/interval in polar coordinate */], m);
}
export const PRIMITIVE_MARKS = _.keys(Mark);

export const STROKE_CONFIG = [
  'stroke',
  'strokeWidth',
  'strokeDash',
  'strokeDashOffset',
  'strokeOpacity',
  'strokeJoin',
  'strokeMiterLimit'
] as const;

export const FILL_CONFIG = ['fill', 'fillOpacity'] as const;

export const FILL_STROKE_CONFIG = [...STROKE_CONFIG, ...FILL_CONFIG];
