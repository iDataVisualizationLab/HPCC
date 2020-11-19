function calculateMeasure2D({data,nummeasure=8,varSize=2,index2instance=new Map(),index2dim=new Map(),experiment}) {
    let measures=[];
    var lag = 0;
    for (let i=0; i<nummeasure; i++) {
        measures[i] = [];
    }
    data.forEach(function (sample, p) {

        // Declare measure structures
        for (let i = 0; i < nummeasure; i++) {
            measures[i][p] = [];
        }
        var myIndex = 0;
        // Each plot
        for (let yvar = 0; yvar < varSize; yvar++) {
            for (let xvar = 0; xvar < yvar; xvar++) {

                // Initialize measure values
                for (let i = 0; i < nummeasure; i++) {
                    measures[i][p][myIndex] = [xvar, yvar, -1];
                }

                // create calculation data
                var xdata = sample[xvar].map(function (x) {return x});
                var ydata = sample[yvar].map(function (y) {return y});
                xdata.forEach(function (x, ix) {ydata[ix] = (x === -1 || x === -Infinity) ? -1 : ydata[ix];});
                ydata.forEach(function (y, iy) {xdata[iy] = (y === -1 || y === -Infinity) ? -1 : xdata[iy];});
                xdata = xdata.filter(function (x) {return x >= 0});
                ydata = ydata.filter(function (y) {return y >= 0});
                if (xdata.length !== ydata.length) {
                    console.log("2 series have different length at: sample = " + p + ", x-var = " + xvar + ", y-var = " + yvar);
                }

                // CALCULATIONS RELATED LENGTH
                var edgelength = [];
                var sumlength = 0;
                let meanX = 0;
                let meanY = 0;
                xdata.forEach(function (x, xi) {
                    if (xi) {
                        var xlength = x - xdata[xi - 1];
                        var ylength = ydata[xi] - ydata[xi - 1];
                        edgelength[xi - 1] = Math.sqrt(xlength * xlength + ylength * ylength);
                        sumlength += edgelength[xi - 1];
                    }
                    meanX += x;
                    meanY += ydata[xi];
                });
                meanX /= xdata.length;
                meanY /= ydata.length;
                var sortlength = edgelength.filter(function (v) {return v >= 0});
                sortlength.sort(function (b, n) {return b - n});   // ascending

                // OUTLYING
                // measures[1][p][myIndex][2] = Math.sqrt(Math.pow(xdata[xdata.length - 1] - xdata[0], 2) + Math.pow(ydata[ydata.length - 1] - ydata[0], 2)) / sumlength;
                if (xdata.length > 1) {
                    measures[0][p][myIndex][2] = 0;
                    var outlier = [];
                    var smyIndex = 0;
                    var q1 = sortlength[Math.floor(sortlength.length * 0.25)];
                    var q3 = sortlength[Math.floor(sortlength.length * 0.75)];
                    var upperlimit = q3 + 1.5 * (q3 - q1);
                    edgelength.forEach(function (e, ei) {
                        if (ei === 0) {
                            if (e > upperlimit) {
                                outlier[smyIndex] = ei;
                                measures[0][p][myIndex][2] += e;
                                smyIndex += 1;
                            }
                        } else if (ei === edgelength.length - 1) {
                            if (e > upperlimit) {
                                outlier[smyIndex] = ei + 1;
                                measures[0][p][myIndex][2] += e;
                                smyIndex += 1;
                                if (edgelength[ei - 1] > upperlimit) {
                                    outlier[smyIndex] = ei;
                                    measures[0][p][myIndex][2] += edgelength[ei - 1];
                                    smyIndex += 1;
                                }
                            }
                        } else {
                            if (e > upperlimit && edgelength[ei - 1] > upperlimit) {
                                outlier[smyIndex] = ei;
                                if (outlier[smyIndex - 1] !== outlier[smyIndex] - 1) {
                                    measures[0][p][myIndex][2] += e + edgelength[ei - 1];
                                } else {
                                    measures[0][p][myIndex][2] += e;
                                }
                                smyIndex += 1;
                            }
                        }
                    });
                    measures[0][p][myIndex][2] /= sumlength;
                    if (measures[0][p][myIndex][2] > 1) measures[0][p][myIndex][2] = 1;
                    var adjust = 0;
                    outlier.forEach(function (v) {
                        xdata.splice(v - adjust, 1);
                        ydata.splice(v - adjust, 1);
                        adjust += 1;
                    });
                }

                // CALCULATIONS RELATED LENGTH AFTER REMOVING OUTLIERS
                var edgelengtha = [];
                var sumlengtha = 0;
                var meanx = 0;
                var meany = 0;
                xdata.forEach(function (x, xi) {
                    if (xi) {
                        var xlength = x - xdata[xi - 1];
                        var ylength = ydata[xi] - ydata[xi - 1];
                        edgelengtha[xi - 1] = Math.sqrt(xlength * xlength + ylength * ylength);
                        sumlengtha += edgelengtha[xi - 1];
                    }
                    meanx += x;
                    meany += ydata[xi];
                });
                meanx /= xdata.length;
                meany /= ydata.length;
                var sortlengtha = edgelengtha.map(function (v) {
                    return v
                });
                sortlengtha.sort(function (b, n) {
                    return b - n
                });   // ascending


                // CALCULATE SOME MEASURES
                // do not consider outliers and L-shape plots
                // The threshold here is 0.6
                if (xdata.length > 1) {
                    var dir = [0, 0, 0, 0];    // count directions for Trend
                    var countcrossing = 0;  // count #intersections
                    var sumcos = 0;   // sum of cosine of angles
                    // var looparr = [];
                    // var looplength = Infinity;
                    var countcosine = 0;
                    xdata.forEach(function (x, xi) {
                        for (var i = xi + 1; i < xdata.length; i++) {   // for all data after x
                            // count directions for MONOTONIC TREND
                            var xx = xdata[i] - x;
                            var yy = ydata[i] - ydata[xi];
                            if (xx > 0 && yy > 0) {dir[0] += 1;}
                            if (xx < 0 && yy > 0) {dir[1] += 1;}
                            if (xx < 0 && yy < 0) {dir[2] += 1;}
                            if (xx > 0 && yy < 0) {dir[3] += 1;}
                            // check intersections for INTERSECTIONS
                            // if (i > xi + 1 && i < xSmooth.length - 1 && xi < xSmooth.length - 3) {
                            //     if (checkintersection(xSmooth[xi], ySmooth[xi], xSmooth[xi + 1], ySmooth[xi + 1], xSmooth[i], ySmooth[i], xSmooth[i + 1], ySmooth[i + 1])) {
                            //         looplength = (looplength > (i - xi)) ? i - xi : looplength;
                            //     }
                            // }
                            if (i > xi + 1 && i < xdata.length - 1 && xi < xdata.length - 3) {
                                if (checkintersection(x, ydata[xi], xdata[xi + 1], ydata[xi + 1], xdata[i], ydata[i], xdata[i + 1], ydata[i + 1])) {
                                    countcrossing += 1;
                                }
                            }
                        }
                        if (xi > 0 && xi < xdata.length - 1) {
                            // sumcos += Math.abs(calculatecos(xdata[xi - 1], ydata[xi - 1], x, ydata[xi], xdata[xi + 1], ydata[xi + 1]));
                            sumcos += calculatecos(xdata[xi - 1], ydata[xi - 1], x, ydata[xi], xdata[xi + 1], ydata[xi + 1]);
                            if(calculatecos(xdata[xi - 1], ydata[xi - 1], x, ydata[xi], xdata[xi + 1], ydata[xi + 1]) > 0.75) countcosine += 1;
                        }
                    });
                    // LENGTH
                    // measures[7][p][myIndex][2] = sumlengtha / (xdata.length - 1);
                    // measures[7][p][myIndex][2] = sumlength / (xdata.length - 1);
                    measures[6][p][myIndex][2] = 4 * sumlength / (xdata.length - 1);
                    if (measures[6][p][myIndex][2] > 1) measures[6][p][myIndex][2] = 1;
                    // MONOTONIC TREND
                    measures[3][p][myIndex][2] = (4/3)*Math.max(...dir) / (xdata.length*(xdata.length-1)/2)-1/3;
                    if (measures[3][p][myIndex][2] < 0) measures[3][p][myIndex][2] = 0;
                    // INTERSECTIONS
                    measures[7][p][myIndex][2] = 1 - Math.exp(-countcrossing / (xdata.length - 1));
                    // STRIATED
                    // measures[2][p][myIndex][2] = (sumcos / (xdata.length - 2))*0.5+0.5;   //Average cosine
                    measures[2][p][myIndex][2] = countcosine/(xdata.length-1);     // Sacgnostic
                    // STRAIGHT
                    // measures[1][p][myIndex][2] = Math.sqrt(Math.pow(xdata[xdata.length - 1] - xdata[0], 2) + Math.pow(ydata[ydata.length - 1] - ydata[0], 2)) / sumlength;
                    // SKEWED
                    // var q10 = sortlengtha[Math.floor(sortlengtha.length * 0.1)];
                    // var q50 = sortlengtha[Math.floor(sortlengtha.length * 0.5)];
                    // var q90 = sortlengtha[Math.floor(sortlengtha.length * 0.9)];
                    // measures[2][p][myIndex][2] = (q90 !== q10) ? (q90 - q50) / (q90 - q10) : 0;
                    // SPARSE
                    // measures[4][p][myIndex][2] = q90;
                    // if (measures[4][p][myIndex][2] > 1) measures[4][p][myIndex][2] = 1;

                    // CLUMPY
                    measures[1][p][myIndex][2] = 0;
                    let Q3 = sortlengtha[Math.floor(sortlengtha.length*0.75)];
                    // let Q3 = sortlength[Math.floor(sortlength.length*0.75)];
                    xdata.forEach(function (x, xi) {
                        if (edgelengtha[xi] >= Q3) {
                            // if (edgelength[xi] >= Q3) {
                            var countleft = 0;
                            var countright = 0;
                            var maxleft = 0;
                            var maxright = 0;
                            let stepLeft = xi-1;
                            while (edgelengtha[stepLeft] < edgelengtha[xi] && stepLeft >= 0) {
                                // while (edgelength[stepLeft] < edgelength[xi] && stepLeft >= 0) {
                                countleft += 1;
                                // maxleft = (maxleft < edgelengtha[stepLeft]) ? edgelengtha[stepLeft] : maxleft;
                                maxleft = (maxleft < edgelength[stepLeft]) ? edgelength[stepLeft] : maxleft;
                                stepLeft -= 1;
                            }
                            let stepRight = xi+1;
                            while (edgelengtha[stepRight] < edgelengtha[xi] && stepRight < xdata.length) {
                                // while (edgelength[stepRight] < edgelength[xi] && stepRight < xdata.length) {
                                countright += 1;
                                // maxright = (maxright < edgelengtha[stepRight]) ? edgelengtha[stepRight] : maxright;
                                maxright = (maxright < edgelength[stepRight]) ? edgelength[stepRight] : maxright;
                                stepRight += 1;
                            }
                            if (countleft > 0 && countright > 0) {
                                var maxxi = (countright > countleft) ? maxright : maxleft;
                                maxxi /= edgelengtha[xi];
                                // maxxi /= edgelength[xi];
                                maxxi = 1 - maxxi;
                                maxxi = maxxi*edgelengtha[xi]/0.3;
                                maxxi = maxxi > 1 ? 1 : maxxi;
                                measures[1][p][myIndex][2] = (measures[1][p][myIndex][2] < maxxi) ? maxxi : measures[1][p][myIndex][2];
                            }
                        }
                    });

                    // LOOP
                    let instance, x_var, y_var, loop;
                    instance = index2instance.get(p);
                    x_var = index2dim.get(xvar);
                    y_var = index2dim.get(yvar);
                    loop = experiment.loop[instance].find(element=>element[0]===x_var&&element[1]===y_var);
                    if (!loop) measures[5][p][myIndex][2] = 0;
                    else if (loop) if (loop[2].length === 0) measures[5][p][myIndex][2] = 0;
                    else measures[5][p][myIndex][2] = Math.max(...loop[2].map(element=>element[2]))*loop[2].filter(e=>e[2]>0).length;
                    if (measures[5][p][myIndex][2] > 1) measures[5][p][myIndex][2] = 1;

                    // measures[5][p][myIndex][2] = (looplength === Infinity) ? 0 : looplength/xdata.length;
                    // measures[9][p][myIndex][2] = (looplength > 0) ? looplength / xdata.length : 0;

                    // CROSS - CORRELATION
                    var maxr = 0;
                    var covxy = 0;
                    var covx = 0;
                    var covy = 0;
                    var sim = 0;
                    var minsim = Infinity;
                    var getLag = lag;
                    for (var i = -lag; i < lag + 1; i++) {
                        if (i <= 0) {
                            for (var j = 0; j < xdata.length - lag; j++) {
                                covxy += (xdata[j] - meanx) * (ydata[j - i] - meany);
                                covx += Math.pow(xdata[j] - meanx, 2);
                                covy += Math.pow(ydata[j - i] - meany, 2);
                                sim += Math.abs(xdata[j] - ydata[j - i]);
                            }
                            var r = Math.abs(covxy / Math.sqrt(covx * covy));
                            getLag = (minsim > sim) ? i : getLag;
                            minsim = (minsim > sim) ? sim : minsim;
                        } else {
                            for (var j = 0; j < xdata.length - lag; j++) {
                                covxy += (xdata[j + i] - meanx) * (ydata[j] - meany);
                                covx += Math.pow(xdata[j + i] - meanx, 2);
                                covy += Math.pow(ydata[j] - meany, 2);
                                sim += Math.abs(xdata[j + i] - ydata[j]);
                            }
                            var r = Math.abs(covxy / Math.sqrt(covx * covy));
                            getLag = (minsim > sim) ? i : getLag;
                            minsim = (minsim > sim) ? sim : minsim;
                        }
                        maxr = (maxr < r) ? r : maxr;
                    }
                    measures[4][p][myIndex][2] = maxr;

                    // SIMILARITY
                    // measures[10][p][myIndex][2] = 1 - minsim / (xdata.length-getLag);

                    // CALCULATE AREA
                    // set value of bins inside triangles is 1, outside triangles is 0
                    // count bin of 1, multiple it with cell area
                    // for (var i = 0; i < numcell; i++) {
                    //     cellval[i] = [];
                    //     for (var j = 0; j < numcell; j++) {
                    //         cellval[i][j] = 0;
                    //     }
                    // }
                    // if (xdata.length > 3) {
                    //     for (var i = 0; i < xdata.length - 2; i++) {
                    //         var xmax = Math.max(...[xdata[i], xdata[i + 1], xdata[i + 2]]);
                    //         var xmin = Math.min(...[xdata[i], xdata[i + 1], xdata[i + 2]]);
                    //         var ymax = Math.max(...[ydata[i], ydata[i + 1], ydata[i + 2]]);
                    //         var ymin = Math.min(...[ydata[i], ydata[i + 1], ydata[i + 2]]);
                    //         xmin = Math.floor(xmin / cellsize);
                    //         xmax = Math.ceil(xmax / cellsize);
                    //         ymin = Math.floor(ymin / cellsize);
                    //         ymax = Math.ceil(ymax / cellsize);
                    //         for (var j = xmin; j <= xmax; j++) {
                    //             for (var k = ymin; k <= ymax; k++) {
                    //                 var xcell = j * cellsize + cellsize / 2;
                    //                 var ycell = k * cellsize + cellsize / 2;
                    //                 if (checkinsidetriangle(xcell, ycell, xdata[i], ydata[i], xdata[i + 1], ydata[i + 1], xdata[i + 2], ydata[i + 2])) {
                    //                     cellval[j][k] = 1;
                    //                 }
                    //             }
                    //         }
                    //     }
                    //     measures[1][p][myIndex][2] = 0;
                    //     cellval.forEach(function (row) {
                    //         row.forEach(function (column) {
                    //             measures[1][p][myIndex][2] += column;
                    //         });
                    //     });
                    //     measures[1][p][myIndex][2] *= cellsize * cellsize;
                    //     measures[1][p][myIndex][2] = 1 -  measures[1][p][myIndex][2];
                    // }


                }


                // increase myIndex
                myIndex += 1;
            }
        }
    });
    return measures;
}


// CHECK INTERSECTIONS
function checkintersection(x1_, y1_, x2_, y2_, x3_, y3_, x4_, y4_) {
    var x1 = x1_;
    var y1 = y1_;
    var x2 = x2_;
    var y2 = y2_;
    var x3 = x3_;
    var y3 = y3_;
    var x4 = x4_;
    var y4 = y4_;
    var v1x = x2 - x1;
    var v1y = y2 - y1;
    var v2x = x4 - x3;
    var v2y = y4 - y3;
    var v23x = x3 - x2;
    var v23y = y3 - y2;
    var v24x = x4 - x2;
    var v24y = y4 - y2;
    var v41x = x1 - x4;
    var v41y = y1 - y4;
    var checkv1 = (v1x * v23y - v1y * v23x) * (v1x * v24y - v1y * v24x);
    var checkv2 = (v2x * v41y - v2y * v41x) * (v2y * v24x - v2x * v24y);
    var check = (checkv1 < 0) && (checkv2 < 0);
    return check;
}

// CALCULATE COSINE OF ANGLES
// input: coordinates of 3 points: 1, 2 and 3
// construct vector 1->2 and 2->3
// calculate dot product of 2 vectors
// get the angle
function calculatecos(x1_, y1_, x2_, y2_, x3_, y3_) {
    var v1x = x2_ - x1_;
    var v1y = y2_ - y1_;
    var v2x = x3_ - x2_;
    var v2y = y3_ - y2_;
    var dotproduct = v1x * v2x + v1y * v2y;
    var v1 = Math.sqrt(v1x * v1x + v1y * v1y);
    var v2 = Math.sqrt(v2x * v2x + v2y * v2y);
    var cosangle;
    if (v1*v2 !== 0) {
        cosangle = dotproduct / (v1 * v2);
    } else
        cosangle = 0;
    return cosangle;
}

