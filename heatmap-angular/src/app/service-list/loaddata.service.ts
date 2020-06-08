import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import * as d3 from 'd3';
import * as _ from 'lodash';


// @Injectable({
//   providedIn: 'root',
// })

@Injectable()
export class Loaddata {
  private DATAOBJ: any;
  private dataSource   = new BehaviorSubject<any>([]);
  private serviceSource   = new BehaviorSubject<any>([]);
  get dataObj() {
    return this.DATAOBJ;
  }

  set dataObj(value) {
    this.DATAOBJ = value;
  }

  sampleS: any;
  hosts: any;
  serviceFullList = this.serviceSource.asObservable();
  serviceList: any;
  serviceListSelected: any;
  serviceListattr: any;
  serviceLists: any;
  serviceAttr: any;
  serviceListattrnest: any;
  dataframe = this.dataSource.asObservable();

  constructor() {
  }
  onChangeService(newservice){
    this.serviceSource.next(newservice);
  }
  // reset = (hard) => {
  //   this.dataObj = Dataset.currentDataset;
  // }
  loadData() {
    const self = this;
    const choice = self.dataObj;
    if (choice.category === 'hpcc') {
      d3.json(choice.url).then((data) => {
        if (!choice.values) {
          loadata1(data);
        } else {
          loadata1(choice.values);
        }
      });

    }
    // else {
    //   readFilecsv(choice.url, choice.separate, choice);
    // }
    function loadata1(data) {
      data.timespan = data.timespan.map(d => new Date(d3.timeFormat('%a %b %d %X CDT %Y')(new Date(+d ? +d : d.replace('Z', '')))));
      self.sampleS = data;
      if (choice.category === 'hpcc') {
        systemFormat();
        self.hosts = _.without(d3.keys(data), 'timespan');
        // formatService(true);
      }
      _.without(Object.keys(data), 'timespan').forEach(h => {
        delete data[h].arrCPU_load;
        self.serviceLists.forEach((s, si) => {
          if (data[h][self.serviceListattr[si]]) {
            data[h][self.serviceListattr[si]] = data.timespan.map((d, i) => {
              if (data[h][self.serviceListattr[si]][i]) {
                return data[h][self.serviceListattr[si]][i].slice(0, s.sub.length).map(e => e ? e : null);
              } else {
                return d3.range(0, s.sub.length).map(e => null);
              }
            });
          } else {
            data[h][self.serviceListattr[si]] = data.timespan.map(d => d3.range(0, s.sub.length).map(e => null));
          }
        });
      });

      const dataframe = [];
      self.hosts.forEach((hname, hi) => {
        const hostdata = self.sampleS[hname];
        self.sampleS.timespan.forEach((t, ti) => {
          const values = {timestep: self.sampleS.timespan[ti], compute: hname};
          self.serviceLists.forEach((s, si) => {
            s.sub.forEach((sub, subi) => {
              values[sub.text] = hostdata[self.serviceListattr[si]][ti][subi];
            });
          });
          dataframe.push(values);
        });
      });
      self.dataSource.next(dataframe);
      // if (choice.group==='url'||choice.url.includes('influxdb')){
      //   processResult = processResult_influxdb;
      //   db = 'influxdb';
      //   realTimesetting(false, 'influxdb',true,sampleS);
      // }else {
      //   db = 'nagios';
      //   processResult = processResult_old;
      //   realTimesetting(false,undefined,true,sampleS);
      // }
      //
      // let clusternum = (data['timespan'].length<50)?[5,7]:[6,8];
      // loadPresetCluster(choice.url.replace(/(\w+).json|(\w+).csv/, '$1'),(status)=>{loadclusterInfo= status;
      //   if(loadclusterInfo){
      //     handle_dataRaw();
      //     initDataWorker();
      //     if (!init)
      //       resetRequest();
      //     else
      //       main();
      //     preloader(false)
      //   }else {
      //     recalculateCluster({
      //       clusterMethod: 'leaderbin',
      //       normMethod: 'l2',
      //       bin: {startBinGridSize: 4, range: clusternum}
      //     }, function () {
      //       handle_dataRaw();
      //       initDataWorker();
      //       main();
      //     });
      //   }

      // });
      function systemFormat() {
        self.serviceList = ['Temperature', 'Job_load', 'Memory_usage', 'Fans_speed', 'Power_consum', 'Job_scheduling'];
        self.serviceListSelected = [{ text: 'Temperature', index: 0}, {text: 'Job_load', index: 1}, {
          text: 'Memory_usage',
          index: 2
        }, {text: 'Fans_speed', index: 3}, {text: 'Power_consum', index: 4}];
        self.serviceListattr = ['arrTemperature', 'arrCPU_load', 'arrMemory_usage',
          'arrFans_health', 'arrPower_usage', 'arrJob_scheduling'];
        self.serviceLists = [{
          text: 'Temperature',
          id: 0,
          enable: false,
          sub: [{
            text: 'CPU1 Temp',
            id: 0,
            enable: false,
            idroot: 0,
            angle: 5.834386356666759,
            range: [3, 98]
          }, {text: 'CPU2 Temp', id: 1, enable: false, idroot: 0, angle: 0, range: [3, 98]}, {
            text: 'Inlet Temp',
            id: 2,
            enable: false,
            idroot: 0,
            angle: 0.4487989505128276,
            range: [3, 98]
          }]
        }, {
          text: 'Job_load',
          id: 1,
          enable: false,
          sub: [{text: 'Job load', id: 0, enable: false, idroot: 1, angle: 1.2566370614359172, range: [0, 10]}]
        }, {
          text: 'Memory_usage',
          id: 2,
          enable: false,
          sub: [{text: 'Memory usage', id: 0, enable: false, idroot: 2, angle: 1.8849555921538759, range: [0, 99]}]
        }, {
          text: 'Fans_speed',
          id: 3,
          enable: false,
          sub: [{
            text: 'Fan1 speed',
            id: 0,
            enable: false,
            idroot: 3,
            angle: 2.4751942119192307,
            range: [1050, 17850]
          }, {
            text: 'Fan2 speed',
            id: 1,
            enable: false,
            idroot: 3,
            angle: 2.9239931624320583,
            range: [1050, 17850]
          }, {
            text: 'Fan3 speed',
            id: 2,
            enable: false,
            idroot: 3,
            angle: 3.372792112944886,
            range: [1050, 17850]
          }, {text: 'Fan4 speed', id: 3, enable: false, idroot: 3, angle: 3.8215910634577135, range: [1050, 17850]}]
        }, {
          text: 'Power_consum',
          id: 4,
          enable: false,
          sub: [{text: 'Power consumption', id: 0, enable: false, idroot: 4, angle: 4.71238898038469, range: [0, 200]}]
        }];
        self.serviceSource.next(serviceLists2serviceFullList(self.serviceLists));
        self.serviceListattrnest = [
          {key: 'arrTemperature', sub: ['CPU1 Temp', 'CPU2 Temp', 'Inlet Temp']},
          {key: 'arrCPU_load', sub: ['Job load']},
          {key: 'arrMemory_usage', sub: ['Memory usage']},
          {key: 'arrFans_health', sub: ['Fan1 speed', 'Fan2 speed', 'Fan3 speed', 'Fan4 speed']},
          {key: 'arrPower_usage', sub: ['Power consumption']}];
        self.serviceAttr = {
          arrTemperature: {key: 'Temperature', val: ['arrTemperatureCPU1', 'arrTemperatureCPU2']},
          arrCPU_load: {key: 'CPU_load', val: ['arrCPU_load']},
          arrMemory_usage: {key: 'Memory_usage', val: ['arrMemory_usage']},
          arrFans_health: {key: 'Fans_speed', val: ['arrFans_speed1', 'arrFans_speed2']},
          arrPower_usage: {key: 'Power_consumption', val: ['arrPower_usage']}
        };
      }

      function serviceLists2serviceFullList(serviceLists) {
        const temp = [];
        serviceLists.forEach(s => s.sub.forEach(sub => {
          sub.idroot = s.id;
          sub.enable = s.enable && (sub.enable === undefined ? true : sub.enable);
          temp.push(sub);
        }));
        return temp;
      }
    }
  }

  // function readFilecsv(file,separate,object) {
  //   separate = separate||'|';
  //   firstTime= true;
  //   exit_warp();
  //   preloader(true, 0, 'Load data....');
  //
  //   function loadcsv(data) {
  //     shap={};
  //     d3.json(object.url.replace(/(\w+).json|(\w+).csv/, '$1_shap.json'), function (error, shape) {
  //       if(!error)
  //         shap  = shape;
  //     });
  //
  //     db = 'csv';
  //     newdatatoFormat_noSuggestion(data, separate);
  //     inithostResults();
  //     formatService(true);
  //     processResult = processResult_csv;
  //     initTsnedata();
  //     makedataworker();
  //     initDataWorker();
  //     // addDatasetsOptions()
  //
  //     MetricController.axisSchema(serviceFullList, true).update();
  //     firstTime = false;
  //     realTimesetting(false, 'csv', true, sampleS);
  //     updateDatainformation(sampleS['timespan']);
  //
  //     sampleJobdata = [{
  //       jobID: '1',
  //       name: '1',
  //       nodes: hosts.map(h => h.name),
  //       startTime: new Date(_.last(sampleS.timespan) - 100).toString(),
  //       submitTime: new Date(_.last(sampleS.timespan) - 100).toString(),
  //       user: 'dummyJob'
  //     }];
  //
  //
  //     updateClusterControlUI();
  //     // preloader(true, 0, 'File loaded: ' + Math.round(evt.loaded/evt.total*100)+'%');
  //     loadPresetCluster(file?file.replace(/(\w+).json|(\w+).csv/, '$1'): '', (status) => {
  //       let loadclusterInfo = status;
  //       if (loadclusterInfo) {
  //         handle_dataRaw();
  //         if (!init)
  //           resetRequest();
  //         preloader(false);
  //       } else {
  //         recalculateCluster({
  //           clusterMethod: 'leaderbin',
  //           normMethod: 'l2',
  //           bin: {startBinGridSize: 4, range: [7, 9]}
  //         }, function () {
  //           handle_dataRaw();
  //           if (!init)
  //             resetRequest();
  //           preloader(false);
  //         });
  //       }
  //     })
  //   }
  //
  //   setTimeout(() => {
  //     if (file) {
  //       d3.csv(file).on('progress', function (evt) {
  //         if (evt.total) {
  //           preloader(true, 0, 'File loaded: ' + Math.round(evt.loaded / evt.total * 100) + '%');
  //           dataInformation.size = evt.total;
  //         } else {
  //           preloader(true, 0, 'File loaded: ' + bytesToString(evt.loaded));
  //           dataInformation.size = evt.loaded;
  //         }
  //         // console.log('Amount loaded: ' + Math.round(evt.loaded/evt.total*100)+'%')
  //       }).get(function (error, data) {
  //         if (error) {
  //         } else {
  //           loadcsv(data);
  //
  //         }
  //       })
  //     }else{
  //       dataInformation.size = object.size;
  //       loadcsv(object.values)
  //     }
  //   }, 0);
  // }
  // Loaddata.reset();

}
