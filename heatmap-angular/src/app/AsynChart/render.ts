import {RECT, LINE, AREA, Mark} from './mark';
import {scheme} from './model';
export function getRenderItem(m: Mark ) {
  return ;
}
interface RenderItem {
  (start: number): string;
  scheme: any;
  draw(): void;
}
export function RECTrender(data: any, ctx: any, color: any): RenderItem{
  let renderItem = new RenderItem();
  ctx.fillRect(scheme.x.scale(d[scheme.x.key]),scheme.y.scale(d[scheme.y.key]),scheme.x.scale.bandwidth(),scheme.y.scale.bandwidth());
  // ctx.fillRect(scheme.x.scale(d[scheme.x.key]),scheme.y.scale(d[scheme.y.key]),1,scheme.y.scale.bandwidth());
  if (color){
    ctx.fillStyle = color;
    ctx.fill();
  }
  return
}
