class Data_processing {
    constructor (data) {
        this.data = data;   // this.data has the same reference with input parameter: data

        // clear the global variable
        this.experiment = {};
        this.experiment.data = {};
        this.experiment.dataRaw = {};
        this.experiment.dataSmooth = {};
        this.experiment.dataSmoothRaw = {};
        this.experiment.timeInfo = [];
        this.experiment.instanceInfo = [];
        this.experiment.variableInfo = [];
    }

    // read to global variables
    read () {
        // read some information of data
        this.experiment.timeInfo = this.data[0].columns.filter((element,index)=>index!==0);
        this.experiment.instanceInfo = this.data[1].map(element=>element.name);
        this.experiment.variableInfo = this.data[2].map(element=>element.name);
        this.experiment.timeInfo.splice(0,2);
        // read data
        let n_timeSeries = this.data[0].length;
        let n_timePoint = this.data[0].columns.length-1;
        let n_instances = this.data[1].length;
        let n_variable = this.data[2].length;
        let mapSeries = [];
        for (let i = 0; i < n_timeSeries; i++) {
            let sampleCode, variableCode;

            sampleCode = this.data[0][i]['userid'];
            variableCode = this.data[0][i]['Type'];
            if (this.data[2].findIndex(element=>element.code===variableCode)!==-1) mapSeries.push([sampleCode,variableCode,i]);
            this.experiment.area = 0.000625;
            this.experiment.offset = 2;

        }
        for (let i = 0; i < n_instances; i++) {
            this.experiment.data[this.data[1][i].name] = {};
            this.experiment.dataRaw[this.data[1][i].name] = {};
            for (let j = 0; j < n_variable; j++) {
                let sampleCode = this.data[1][i].code;
                let variableCode = this.data[2][j].code;
                let rowMatrix = mapSeries.find(element=>element[0]===sampleCode&&element[1]===variableCode);
                if (rowMatrix) {
                    let row = rowMatrix[2];
                    let timeSeries = [];
                    for (let t = 0; t < n_timePoint; t++) {
                        timeSeries[t] = isNaN(parseFloat(this.data[0][row][this.experiment.timeInfo[t]])) ? Infinity : parseFloat(this.data[0][row][this.experiment.timeInfo[t]]);
                    }
                    this.experiment.dataRaw[this.data[1][i].name][this.data[2][j].name] = timeSeries;
                    let maxValue = Math.max(...timeSeries.filter(element=>element!==Infinity));
                    let minValue = Math.min(...timeSeries.filter(element=>element!==Infinity));
                    let rangeValue = maxValue - minValue;
                    this.experiment.data[this.data[1][i].name][this.data[2][j].name] = timeSeries.map(element=>{
                        if (maxValue !== Infinity && minValue !== Infinity) return (element-minValue)/rangeValue;
                        else return Infinity;
                    });
                }
            }
        }
        return true;
    }

    // smooth data
    smooth (window_size) {
        let n_timePoint = this.data[0].columns.length-1;
        let n_instances = this.data[1].length;
        let n_variable = this.data[2].length;
        this.experiment.dataSmooth = {};
        this.experiment.dataSmoothRaw = {};
        for (let i = 0; i < n_instances; i++) {
            let instance = this.experiment.instanceInfo[i];
            this.experiment.dataSmooth[instance] = {};
            this.experiment.dataSmoothRaw[instance] = {};
            for (let v = 0; v < n_variable; v++) {  // generate smooth data
                let variable = this.experiment.variableInfo[v];
                if (this.experiment.data[instance][variable]) {
                    this.experiment.dataSmooth[instance][variable] = [];
                    this.experiment.dataSmoothRaw[instance][variable] = [];
                    for (let t = 0; t < n_timePoint-window_size; t++) {
                        this.experiment.dataSmooth[instance][variable][t] = 0;
                        this.experiment.dataSmoothRaw[instance][variable][t] = 0;
                        for (let s = 0; s < window_size; s++) {
                            this.experiment.dataSmooth[instance][variable][t] += this.experiment.data[instance][variable][t+s];
                            this.experiment.dataSmoothRaw[instance][variable][t] += this.experiment.dataRaw[instance][variable][t+s];
                        }
                        this.experiment.dataSmooth[instance][variable][t] /= window_size;
                        this.experiment.dataSmoothRaw[instance][variable][t] /= window_size;
                    }
                }
            }
        }
        return true;
    }


}
