import {Data} from './data';
import {ScaleType} from './scale';
import {Mark} from './mark';
interface BaseOpt {
  key: string;
  type: ScaleType;
}
interface AxisOpt extends BaseOpt{
  domain: any;
  range: any;
  scale: any;
  opacity?: number;
  visible?: boolean;
  axis?: any;
}
interface MarkOpt{
  key?: string;
  type: Mark;
  value?: string;
  scale?: any;
  path?: any;
}
export interface Scheme {
  data: Data;
  x: AxisOpt;
  y: AxisOpt;
  color: AxisOpt;
  mark: MarkOpt;
}

