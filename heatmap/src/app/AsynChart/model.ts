import {Data} from './data';
import {ScaleType} from './scale';
interface BaseOpt {
  key: string;
  type: ScaleType;
}
interface AxisOpt extends BaseOpt{
  domain: any;
  range: any;
  scale(): any;
}
interface MarkOpt{
  key?: string;
  type: ScaleType;
  value?: string;
}
export interface Scheme {
  data: Data;
  x: AxisOpt;
  y: AxisOpt;
  color: AxisOpt;
  mark: MarkOpt;
}

