import {Component, Input, OnInit} from '@angular/core';
import * as d3 from 'd3';
import * as _ from 'lodash';

@Component({
  selector: 'app-violin-chart',
  templateUrl: './violin-chart.component.html',
  styleUrls: ['./violin-chart.component.scss']
})


export class ViolinChartComponent implements OnInit {
  @Input() graphicopt = {
    margin: {top: 0, right: 10, bottom: 0, left: 10},
    width: 200,
    height: 10,
    scalezoom: 1,
    widthView(){return this.width * this.scalezoom; },
    heightView(){return this.height * this.scalezoom; },
    widthG(){return this.widthView() - this.margin.left - this.margin.right; },
    heightG(){return this.heightView() - this.margin.top - this.margin.bottom; },
    direction: 'h',
    dotRadius: 2,
    showOutlier: true,
    color: (d) => '#00000029',
    stroke: 'black',
    customrange: undefined,
    middleAxis: {},
    tick: undefined,
    ticks: {},
    single_w: 0,
    opt: {
      method : 'DensityEstimator', // epsilon is learning rate (10 = default)
      resolution : 50, // resolution
      dataformated: false
    },
    isStack: false
  };
  @Input() data = [];
  @Input() rangeY;
  arr = [];
  h = d3.scaleLinear();
  xNum = d3.scaleLinear();
  gpos: any = d3.scalePoint().padding(0.5);

  viiolinplot = {};
  svg;
  linepointer;
  returnEvent;
  ticksDisplay = [];

  createviolin = d3.area()
    .x0((d) => ( this.xNum(-d[1])))
    .x1((d) => (this.xNum(d[1])))
    .y((d) => (this.h(d[0])) )
  ;
  circleoption(d) {
    return {
      r: this.graphicopt.dotRadius
    };
  }
  draw(contain) {
    const that = this;
    const h = that.h;
    that.arr = handledata(that.data);
    // h
    let getposFunc = (p) => {
      return p.attr('transform', ( d, i) => `translate(${that.graphicopt.margin.left},${that.graphicopt.margin.top + that.gpos(d.axis + i)})`);
    };
    let laxis = (p) => {
      return p.styles(that.graphicopt.middleAxis).attrs({
        x2: that.h(1),
        x1: 0,
        y1: 0,
        y2: 0,
      });
    };
    let tick1 = (p) => {
      return p
        .attrs({
          y1: -5,
          y2: 5,
        }).styles(that.graphicopt.ticks);
    };
    let tick2 = (p) => {
      return p
        .attrs({
          x2: that.h(1),
          x1: that.h(1),
          y1: -5,
          y2: 5,
        }).styles(that.graphicopt.ticks);
    };
    let tickLower = p => {
      return p.styles({'text-anchor': 'end', 'stroke-width': 0}).text(d3.format('.2s')(that.ticksDisplay[0]))
        .attrs({
          dx: -1,
          dy: 4,
        });
    };
    let tickHigher = p => {
      return p .styles({'text-anchor': 'start', 'stroke-width':0}).text(d3.format('.2s'  )(that.ticksDisplay[1]))
        .attrs({
          dx: 1,
          x: that.h.range()[1],
          dy: 4,
        });
    };
    let drawMedian = p => {
      return p.attrs({
        class: 'median',
        width: 2,
        height: 8,
        x: d => that.h(d),
        y: -4,
      });
    };
    if (that.graphicopt.direction === 'v') {
      getposFunc = (p) => {
        return p.attr('transform', (d, i) => `translate(${that.graphicopt.margin.left + that.gpos(d.axis + i)},${that.graphicopt.margin.top})`);
      };
      laxis = (p) => {
        return p.styles(that.graphicopt.middleAxis).attrs({
          x2: 0,
          x1: 0,
          y1: that.h.range()[0],
          y2: that.h.range()[1],
        });
      };
      tick1 = (p) => {
        return p
          .attrs({
            x1: -5,
            x2: 5,
          }).styles(that.graphicopt.ticks);
      };
      tick2 = (p) => {
        return p
          .attrs({
            y2: that.h.range()[1],
            y1: that.h.range()[1],
            x1: -5,
            x2: 5,
          }).styles(that.graphicopt.ticks);
      };
      tickLower = p => {
        return p.styles({'text-anchor': 'end', 'stroke-width': 0}).text(d3.format('.2s')(that.ticksDisplay[0]))
          .attrs({
            dx: 0,
            dy: -1,
          });
      };
      tickHigher = p => {
        return p .styles({'text-anchor': 'start', 'stroke-width': 0}).text(d3.format('.2s')(that.ticksDisplay[1]))
          .attrs({
            dx: 0,
            y: that.h.range()[1],
            dy: -1,
          });
      };
      drawMedian = p => {
        return p.attrs({
          class: 'median',
          width: 8,
          height: 2,
          y: d => that.h(d),
          x: -4,
        });
      };
    }
    let violChart = contain.selectAll('.violin').data(that.arr, d => d.axis)
      .classed('hide',d=>!d.arr.length);
    violChart
      .transition()
      .call(getposFunc);
    violChart.select('.gvisaxis .laxis') .call(laxis);
    violChart.exit().remove();
    const violN = violChart.enter()
      .append('g')
      .attr('class', 'violin')
      .call(getposFunc);
    const axisg = violN.append('g').attr('class', 'gvisaxis')
      .style('stroke', 'black');
    axisg.append('line').attr('class', 'laxis')
      .call(laxis);

    if (that.graphicopt.tick === undefined && that.graphicopt.tick.visibile !=  false) {
      violChart.select('.gvisaxis .tick1') .call(tick1);
      violChart.select('.gvisaxis .tick2') .call(tick1);
      axisg.append('line').attr('class', 'tick1')
        .call(tick1);
      axisg.append('line').attr('class', 'tick2')
        .call(tick2);
      if(that.ticksDisplay.length){
        violChart.select('.gvisaxis text.lower') .call(tickLower);
        violChart.select('.gvisaxis text.higher') .call(tickHigher);

        axisg.append('text').attr('class', 'tickDisplay lower')
          .call(tickLower);

        axisg.append('text').attr('class', 'tickDisplay higher')
          .call(tickHigher);

      }
    }


    violN.append("path");
    violChart = violN.merge(violChart);
    violChart.select('path').datum(d => {return d;})
      .style('stroke', that.graphicopt.stroke)
      .style('stroke-width', '0.2')
      .style('fill', d => that.graphicopt.color(d.axis))
      .transition()
      // .style('fill','currentColor')
      .attr('d',d => that.createviolin(d.arr)   // This makes the line smoother to give the violin appearance. Try d3.curveStep to see the difference
      );

    const median_rect = violChart.selectAll('rect.median').data(d => d.median !== undefined ? [d.median] : []).call(drawMedian);
    median_rect.exit().remove();
    median_rect.enter().append('rect').style('fill', 'black').call(drawMedian);


    if (that.graphicopt.showOutlier) {
      const circledata = that.arr[0].outlier.map(d => {
        return d.x !== undefined ? d : {x: d};
      });


      const circleO = violChart.selectAll('circle.outlier').data(circledata);
      circleO.exit().remove();
      const circlem = circleO.enter().append('circle').attr('class', 'outlier')
        .styles({
          opacity: 0.5,
          fill: 'rgb(138, 0, 26)'
        })
        .merge(circleO)
        .attrs(that.circleoption)
        .attr('cx', d => that.h(d.x)).attr('cy', d => that.xNum(d.y ? d.y : 0));
    }else{
      violChart.selectAll('circle.outlier').remove();
    }
    return violChart;
    function handledata(data){
      if (that.graphicopt.direction === 'v') {
        that.h.range([that.graphicopt.heightG(), 0]);
        if (that.graphicopt.isStack){
          that.gpos = () => 0;
        }else
          that.gpos = d3.scalePoint().padding(0.5).domain(data.map((d,i)=>d.axis+i))
            .range([-that.graphicopt.widthG() / 2, that.graphicopt.widthG() / 2]);
        that.createviolin.curve(d3.curveMonotoneY);
      }else {
        that.h.range([0, that.graphicopt.widthG()]);

        that.gpos = d3.scalePoint().padding(0.5).domain(data.map((d, i) => d.axis + i))
          .range([that.graphicopt.heightG(), 0]);
        that.createviolin.curve(d3.curveMonotoneX);
      }
      let xNumrange = (that.graphicopt.single_w || that.gpos.step()) / 2;
      if (that.graphicopt.isStack) {
        if (data.length === 1) {
          xNumrange = xNumrange * 2;
        }else {
          xNumrange = that.graphicopt.widthG() / data.length;
        }
      }
      that.xNum.range([0, xNumrange]);
      let sumstat;
      if (that.graphicopt.opt.dataformated){
        that.h.domain(that.graphicopt.customrange || [0, 1]);

        sumstat = data;
      }else {
        // @ts-ignore
        that.h.domain( d3.extent(_.flatten(data)) );
        const kde = kernelDensityEstimator(kernelEpanechnikov(.2), that.h.ticks(that.graphicopt.opt.resolution));
      }
      if (that.rangeY){
        that.xNum.domain(that.rangeY);
      }else{
        let maxNum = 0;
        sumstat.forEach((s, i) => {
          const allBins = sumstat[i].arr;
          const kdeValues = allBins.map( (a) => {
            return a[1];
          });
          const biggest = +d3.max(kdeValues);
          if ( biggest > maxNum ) {
            maxNum = biggest;
          }
        });
        that.xNum.domain([0, maxNum]);
      }
      if (that.graphicopt.isStack) {
        const temp = {};
        let min = Infinity;
        let max = -Infinity;
        sumstat = data.map(d => ({axis:d.axis,arr:[]}));
        data.forEach((d,i) => d.arr.forEach(e => {
          if (!temp[e[0]]) {
            temp[e[0]] = [];
            if (min > e[0]) {min = e[0]; }
            if (max < e[0]) {max = e[0]; }
            temp[e[0]].total = 0;
          }
          temp[e[0]].push({id:i, value: e[1]});
          temp[e[0]].total += e [1];
          temp[e[0]].offset = -temp[e[0]].total / 2;
        }));
        Object.keys(temp).forEach(i => {
          temp[i].forEach((d, di) => {
            const y0 = temp[i].offset;
            const y1 = temp[i].offset+d.value;
            sumstat[d.id].arr.push([+i,y0,y1]);
            temp[i].offset = y1;
          });
        });
        sumstat.forEach(s => s.arr.sort((a, b) => a[0] - b[0]));
      }
      return sumstat;
    }

    // 2 functions needed for kernel density estimate
    function kernelDensityEstimator(kernel, X) {
      return (V) => {
        return X.map( (x: number) => {
          return [x, d3.mean(V, (v:number) => kernel(x - v))];
        });
      };
    }

    function kernelEpanechnikov(k) {
      return (v) => {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
      };
    }

    function fixstr(s) {
      return s.replace(/ |#/gi,'');
    }
  }
  constructor() { }

  ngOnInit(): void {
  }

}
