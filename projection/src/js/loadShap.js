class LoadShap {
    data;
    query;
    #dim=2;
    onFinishQuery=[];
    onDataChange=[];
    onStartQuery=()=>{};
    feature=[];
    constructor(url) {
        this.isRealTime = !url;
        let self = this;
        if (!this.isRealTime) {
            let updatePromise=d3.csv(url).then((data) => {
                // preprocess data
                let classIndex = data.columns.slice();
                let keyFeature = classIndex.shift();
                let classObject={};
                let featureObject={};
                classIndex.forEach(k=>classObject[k]={});
                this.feature = [];
                let maxValue = 0;
                data.forEach((d,i)=>{
                    this.feature.push({text:d[keyFeature],range:[0,0],id:i});
                    featureObject[d[keyFeature]] = {};
                    classIndex.forEach(k=>{
                        classObject[k][d[keyFeature]] = +d[k];
                        featureObject[d[keyFeature]][k] = +d[k];
                        if(+d[k]>maxValue)
                            maxValue = +d[k];
                    })
                });
                this.feature.forEach(d=>d.range[1]=maxValue);
                this.data = {_feature:featureObject,_class: classObject};
                this.onDataChange.forEach(function(listener) {
                    listener(self.feature);
                });
                return this.feature;
            });

        }
    }
    request(){
        if(this.data){
            let updatePromise;
            let self = this;
            this.onStartQuery();
            updatePromise = this.calPCA();
            this.onFinishQuery.forEach(function (listener) {
                updatePromise = updatePromise.then(listener);
            });
        }
    }
    calPCA(){
        const self = this;
       return new Promise((resolve,refuse)=>{
           let timer;
            if (!this.data){
                timer = d3.interval(update,100);
            }
            else{
                update();
            }
            function update() {
                if (self.data) {
                    if (timer)
                        timer.stop();
                    let pca = new PCA();
                    let datain = d3.values(self.data._class).map(d=>d3.values(d));
                    let classKey = d3.keys(self.data._class);
                    let matrix = pca.scale(datain, true, false);

                    let std = ss.sampleStandardDeviation(_.flatten(datain))
                    matrix = matrix.map(m=>m.map(d=>d/std));
                    let pc = pca.pca(matrix, self.#dim);
                    let A = pc[0];  // this is the U matrix from SVD
                    let B = pc[1];  // this is the dV matrix from SVD
                    let chosenPC = pc[2];   // this is the most value of PCA
                    let solution = datain.map((d,i)=>{
                        let temp = d3.range(0,self.#dim).map(dim=>A[i][chosenPC[dim]]);
                        temp.metrics = d3.entries(self.data._class[classKey[i]]);
                        temp.name = classKey[i];
                        return temp;
                    });
                    self.feature.map(function (key, i) {
                        let brand = d3.range(0,self.#dim).map(dim=>B[i][chosenPC[dim]]);
                        brand.name = key.text;
                        self.feature[i].pca =  brand;
                    });

                    resolve({solution,feature:self.feature})
                }
            }
       });
    }
    destroy(){
        console.log('load SCag destroyed!');
    }
}
