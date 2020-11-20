class Visual_feature_2D {
    constructor ({smooth,experiment}) {
        this.smooth = smooth;

        this.experiment = experiment||{}
        this.experiment.loop = {};
        this.experiment.highLoop = [];
    }

    // compute loop
    Loop () {
        let n_instances = this.experiment.instanceInfo.length;
        let n_variable = this.experiment.variableInfo.length;
        let n_timePoint = this.experiment.timeInfo.length;
        for (let i = 0; i < n_instances; i++) {
            let instance = this.experiment.instanceInfo[i];
            this.experiment.loop[instance] = [];
            for (let x = 0; x < n_variable - 1; x++) {      // find loop
                let x_var = this.experiment.variableInfo[x];
                if (this.experiment.data[instance][x_var]) {
                    for (let y = x+1; y < n_variable; y++) {
                        let y_var = this.experiment.variableInfo[y];
                        if (this.experiment.data[instance][y_var]) {
                            let outliers = Visual_feature_2D.checkOutliers(this.experiment.data[instance][x_var],this.experiment.data[instance][y_var]);
                            if (this.smooth) {
                                let loopLength = [];
                                let loopNum = 0;
                                for (let t = 0; t < n_timePoint - this.experiment.sliding - 3; t++) {
                                    let x1 = this.experiment.dataSmooth[instance][x_var][t], y1 = this.experiment.dataSmooth[instance][y_var][t];
                                    let x2 = this.experiment.dataSmooth[instance][x_var][t+1], y2 = this.experiment.dataSmooth[instance][y_var][t+1];
                                    if (x1 !== Infinity && x2 !== Infinity && y1 !== Infinity && y2 !== Infinity) {
                                        for (let tt = t+2; tt < n_timePoint - this.experiment.sliding-1; tt++) {
                                            let x3 = this.experiment.dataSmooth[instance][x_var][tt], y3 = this.experiment.dataSmooth[instance][y_var][tt];
                                            let x4 = this.experiment.dataSmooth[instance][x_var][tt+1], y4 = this.experiment.dataSmooth[instance][y_var][tt+1];
                                            if (x3 !== Infinity && y3 !== Infinity && x4 !== Infinity && y4 !== Infinity) {
                                                if (Visual_feature_2D.checkIntersection(x1,y1,x2,y2,x3,y3,x4,y4)) {
                                                    if (tt-t>=this.experiment.offset) {
                                                        let sites = [];
                                                        for (let j = t; j <= tt; j++) {
                                                            sites[j-t] = [this.experiment.dataSmooth[instance][x_var][j],this.experiment.dataSmooth[instance][y_var][j]];     // get coordinates of points in the loop
                                                        }
                                                        let inLoop = Visual_feature_2D.checkSmallLoop(sites);
                                                        let my_area = Visual_feature_2D.area(sites);
                                                        if (inLoop===sites.length && my_area >= this.experiment.area) {     // wrong if t=sites.length
                                                            let convex_score = Visual_feature_2D.convex_score(instance,x_var,y_var,sites);
                                                            let concave_area = hulls.concaveHullArea(hulls.concaveHull(this.experiment.alpha,sites));
                                                            let convex_area = hulls.convexHullArea(hulls.convexHull(sites));
                                                            let ratio = Visual_feature_2D.circularRatio(sites);
                                                            if (convex_score*ratio[0] >= 0) {
                                                                loopLength[loopNum] = [t,tt,convex_score*ratio[0],convex_score,ratio[0],my_area,ratio[1],concave_area,convex_area];
                                                                loopNum += 1;
                                                            }
                                                        }
                                                        t = t+inLoop;
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                this.experiment.loop[instance].push([x_var,y_var,loopLength]);
                            } else {
                                let loopLength = [];
                                let loopNum = 0;
                                for (let t = 0; t < n_timePoint - this.experiment.sliding - 3; t++) {
                                    let x1 = this.experiment.data[instance][x_var][t], y1 = this.experiment.data[instance][y_var][t];
                                    let x2 = this.experiment.data[instance][x_var][t+1], y2 = this.experiment.data[instance][y_var][t+1];
                                    if (x1 !== Infinity && y1 !== Infinity && x2 !== Infinity && y2 !== Infinity) {
                                        for (let tt = t+2; tt < n_timePoint - 1; tt++) {
                                            let x3 = this.experiment.data[instance][x_var][tt], y3 = this.experiment.data[instance][y_var][tt];
                                            let x4 = this.experiment.data[instance][x_var][tt+1], y4 = this.experiment.data[instance][y_var][tt+1];
                                            if (x3 !== Infinity && y3 !== Infinity && x4 !== Infinity && y4 !== Infinity) {
                                                if ( Visual_feature_2D.checkIntersection(x1,y1,x2,y2,x3,y3,x4,y4) && tt-t>=this.experiment.offset) {
                                                    // no outliers in loop
                                                    let check = true;
                                                    if (outliers.length > 0) {
                                                        for (let c = 0; c < outliers.length; c++) {
                                                            if (outliers[c] > t && outliers[c] < tt) {
                                                                check = false;
                                                                break;
                                                            }
                                                        }
                                                    }
                                                    if (check) {
                                                        let sites = [];
                                                        for (let j = t; j <= tt; j++) {
                                                            sites[j-t] = [this.experiment.data[instance][x_var][j],this.experiment.data[instance][y_var][j]];
                                                        }
                                                        let inLoop = Visual_feature_2D.checkSmallLoop(sites);
                                                        // let my_area = Visual_feature_2D.area(sites);
                                                        // if (inLoop===sites.length && my_area >= this.experiment.area) {
                                                        if (inLoop===sites.length) {
                                                            let convex_score = Visual_feature_2D.convex_score(instance,x_var,y_var,sites);
                                                            // let concave_area = hulls.concaveHullArea(hulls.concaveHull(this.experiment.alpha,sites));
                                                            // let convex_area = hulls.convexHullArea(hulls.convexHull(sites));
                                                            let ratio = Visual_feature_2D.circularRatio(sites);
                                                            if (convex_score*ratio[0] > 0) {
                                                                // loopLength[loopNum] = [t,tt,convex_score*ratio[0],convex_score,ratio[0],my_area,ratio[1],concave_area,convex_area];
                                                                loopLength[loopNum] = [t,tt,convex_score*ratio[0]];
                                                                loopNum += 1;
                                                            }
                                                        }
                                                        t = t+inLoop;
                                                        break;
                                                    }
                                                }
                                            } else {
                                                break;
                                            }
                                        }
                                    }
                                }
                                this.experiment.loop[instance].push([x_var,y_var,loopLength]);
                            }
                        }
                    }
                }
            }
        }
    }

    static checkIntersection(x1_, y1_, x2_, y2_, x3_, y3_, x4_, y4_) {
        let v1x = x2_ - x1_;
        let v1y = y2_ - y1_;
        let v2x = x4_ - x3_;
        let v2y = y4_ - y3_;
        let v23x = x3_ - x2_;
        let v23y = y3_ - y2_;
        let v24x = x4_ - x2_;
        let v24y = y4_ - y2_;
        let v41x = x1_ - x4_;
        let v41y = y1_ - y4_;
        let checkV1 = (v1x * v23y - v1y * v23x) * (v1x * v24y - v1y * v24x);
        let checkV2 = (v2x * v41y - v2y * v41x) * (v2y * v24x - v2x * v24y);
        return (checkV1 < 0) && (checkV2 < 0);
    }

    // compute convex score
    static convex_score (instance, x_var, y_var, sites) {
        // let convex = hulls.convexHull(sites);
        // let convexArea = hulls.convexHullArea(convex);
        // let threshold = Data_processing.upperBoxPlot2D(sites);
        // let alpha = 1/threshold;
        // let concave = hulls.concaveHull(alpha,sites);
        // let concaveArea = hulls.concaveHullArea(concave);
        // return concaveArea/convexArea;

        // count number of angle less than pi/2
        let loopSize = sites.length;
        let convex_score = 0;
        for (let i = 0; i < loopSize - 2; i++) {
            let alpha = Visual_feature_2D.computeCosine(sites[i][0],sites[i][1],sites[i+1][0],sites[i+1][1],sites[i+2][0],sites[i+2][1]);
            if (alpha > 0.75 && alpha < 1) {
                convex_score += 1;
            }
        }
        return convex_score/loopSize;

        // check ratio of convex hulls and loop size
        // let loopSize = sites.length;
        // let convex = hulls.convexHull(sites);
        // return convex.length/loopSize;

        // ratio of my area/convex area
        // let my_area = Visual_feature_2D.area(sites);
        // let convex_area = hulls.convexHullArea(hulls.convexHull(sites));
        // return my_area/convex_area;
    }

    static computeCosine(x1_, y1_, x2_, y2_, x3_, y3_) {
        let v1x = x2_ - x1_;
        let v1y = y2_ - y1_;
        let v2x = x3_ - x2_;
        let v2y = y3_ - y2_;
        let dotProduct = v1x * v2x + v1y * v2y;
        let v1 = Math.sqrt(v1x * v1x + v1y * v1y);
        let v2 = Math.sqrt(v2x * v2x + v2y * v2y);
        let cosine;
        if (v1*v2 !== 0) {
            cosine = dotProduct / (v1 * v2);
        } else
            cosine = 0;
        return cosine;
    }

    // check whether a point is inside a triangle or not
    static checkInsideTriangle(xPoint, yPoint, x1_, y1_, x2_, y2_, x3_, y3_) {
        let x0 = xPoint;
        let y0 = yPoint;
        let x1 = x1_;
        let y1 = y1_;
        let x2 = x2_;
        let y2 = y2_;
        let x3 = x3_;
        let y3 = y3_;
        let checkLine = ((x2-x1)/(x3-x1) === (y2-y1)/(y3-y1));
        if (!checkLine) {
            let xOA = x1 - x0;
            let yOA = y1 - y0;
            let xOB = x2 - x0;
            let yOB = y2 - y0;
            let xOC = x3 - x0;
            let yOC = y3 - y0;
            let xAB = x2 - x1;
            let yAB = y2 - y1;
            let xBC = x3 - x2;
            let yBC = y3 - y2;
            let xCA = x1 - x3;
            let yCA = y1 - y3;
            let check1 = xOA * yAB - yOA * xAB;
            let check2 = xOB * yBC - yOB * xBC;
            let check3 = xOC * yCA - yOC * xCA;
            return (check1 > 0 && check2 > 0 && check3 > 0) || (check1 < 0 && check2 < 0 && check3 < 0);
        } else return false;
    }

    // compute area
    static area (sites) {
        if (sites.length < 4) return 0;
        else {
            let check = true;
            for (let i = 0; i < sites.length-3; i++) {
                for (let j = i + 2; j < sites.length - 1; j++) {
                    check = check && !Visual_feature_2D.checkIntersection(sites[i][0],sites[i][1],sites[i+1][0],sites[i+1][1],sites[j][0],sites[j][1],sites[j+1][0],sites[j+1][1]);
                    if (!check) break;
                }
            }
            if (!check) return 0;
            else {
                let n_bin = 40;
                let binSize = 1/n_bin;
                let cellArray = [];
                for (let i = 0; i < n_bin; i++) {
                    cellArray[i] = [];
                    for (let j = 0; j < n_bin; j++) {
                        cellArray[i][j] = 0;
                    }
                }
                // compute from center
                let xCenter = d3.mean(sites.map(element=>element[0]));
                let yCenter = d3.mean(sites.map(element=>element[1]));
                for (let t = 0; t < sites.length-1; t++) {
                    let xMin = Math.floor(Math.min(...[xCenter,sites[t][0],sites[t+1][0]])/binSize);
                    let xMax = Math.ceil(Math.max(...[xCenter,sites[t][0],sites[t+1][0]])/binSize);
                    let yMin = Math.floor(Math.min(...[yCenter,sites[t][1],sites[t+1][1]])/binSize);
                    let yMax = Math.ceil(Math.max(...[yCenter,sites[t][1],sites[t+1][1]])/binSize);
                    for (let i = xMin; i <= xMax; i++) {
                        for (let j = yMin; j <= yMax; j++) {
                            let xCell = i*binSize+binSize/2;
                            let yCell = j*binSize+binSize/2;
                            if (Visual_feature_2D.checkInsideTriangle(xCell,yCell,xCenter,yCenter,sites[t][0],sites[t][1],sites[t+1][0],sites[t+1][1])) {
                                cellArray[i][j] += 1;
                            }
                        }
                    }
                }
                let countBin = 0;
                let x_min = Math.floor(Math.min(...sites.map(element=>element[0]))/binSize);
                let x_max = Math.ceil(Math.max(...sites.map(element=>element[0]))/binSize);
                let y_min = Math.floor(Math.min(...sites.map(element=>element[1]))/binSize);
                let y_max = Math.ceil(Math.max(...sites.map(element=>element[1]))/binSize);
                for (let i = x_min; i < x_max; i++) {
                    for (let j = y_min; j < y_max; j++) {
                        if (cellArray[i][j]%2===1) countBin += 1;
                    }
                }
                return (countBin*binSize*binSize >= 0.01) ? countBin*binSize*binSize : 0;
            }
        }
    }

    // compute ratio of area and the cover squared
    static circularRatio (sites) {
        let xMax = Math.max(...sites.map(element=>element[0]));
        let xMin = Math.min(...sites.map(element=>element[0]));
        let xRange = xMax - xMin;
        let yMax = Math.max(...sites.map(element=>element[1]));
        let yMin = Math.min(...sites.map(element=>element[1]));
        let yRange = yMax - yMin;
        // let edge_square = (xRange > yRange) ? xRange : yRange;
        let box = xRange*yRange;
        let area = Visual_feature_2D.area(sites);
        // return [(4/Math.PI)*area/Math.pow(edge_square,2),Math.pow(edge_square,2)];
        return [(4/Math.PI)*area/box,box];
    }

    // check small loop inside the big loop
    static checkSmallLoop (sites) {
        let n_timePoint = sites.length;
        let result = n_timePoint;
        let count = 0;
        for (let t = 0; t < n_timePoint - 3; t++) {
            for (let tt = t+2; tt < n_timePoint-1; tt++) {
                if (Visual_feature_2D.checkIntersection(sites[t][0],sites[t][1],sites[t+1][0],sites[t+1][1],sites[tt][0],sites[tt][1],sites[tt+1][0],sites[tt+1][1])) {
                    count += 1;
                    // if (count >=2) result = t;
                    if (count >= 1) result = t;
                }
                if (result !== n_timePoint) break;
            }
            if (result !== n_timePoint) break;
        }
        return result;
    }

    // check outliers
    static checkOutliers (xArr,yArr) {
        let N = xArr.length;
        let L = [];
        for (let i = 1; i < N; i++) {
            L[i-1] = Math.sqrt(Math.pow(xArr[i]-xArr[i-1],2)+Math.pow(yArr[i]-yArr[i-1],2));
        }
        let sArr = L.map(e=>e).sort((a,b)=>a-b);
        let q1 = sArr[Math.floor((N-1)*0.25)];
        let q3 = sArr[Math.floor((N-1)*0.75)];
        let iqr = 1.5*(q3-q1);
        let uB = q3 + iqr;
        let outliers = [];
        for (let i = 0; i < N - 1; i++) {
            if(i===0 || i === N - 2) if(L[i] > uB) outliers.push(i);
            if (i > 0 && i < N - 2) if (L[i] > uB && L[i-1] > uB) outliers.push(i);
        }
        return outliers;
    }

}
