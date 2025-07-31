//parametter
const COMPUTE = 'nodes_info';
const JOB = 'jobs_info';
const JOBNAME = 'job_name';
const USER = 'user_name';
let mode = 'historical'; // 'realTime' or 'historical'
const timeFormat = d3.timeFormat('%Y-%m-%dT%H:%M:%S-05:00');
// layout
let Layout = {
    data: {},
}

let serviceSelected = 0;

// let request = new Simulation('../HiperView/data/742020.json');
let request, timelineControl;


// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const TIME_RANGES = [
  { label: 'Sample data', value: -3 , default: true },
  { label: 'Specific time', value: -1 , default: false },
  { label: 'This week', value: 7 , default: false },
  { label: '3 days', value: 3 , default: false },
  { label: 'Today', value: 1 , default: false },
  { label: 'Current time', value: -2 , default: false }
];

const INTERVALS = {
  [-2]: [
    { label: '1m', value: 60000 , default: true},
    { label: '5m', value: 5 * 60000 , default: false},
  ],
  [1]: [
    { label: '5m', value: 5 * 60000 , default: false},
    { label: '10m', value: 10 * 60000, default: true },
    { label: '30m', value: 30 * 60000 , default: false},
    { label: '60m', value: 60 * 60000 , default: false},
  ],
  [3]: [
    { label: '5m', value: 5 * 60000 , default: false},
    { label: '10m', value: 10 * 60000 , default: false},
    { label: '30m', value: 30 * 60000, default: true },
    { label: '60m', value: 60 * 60000 , default: false},
  ],
  [7]: [
    { label: '10m', value: 10 * 60000 , default: false},
    { label: '30m', value: 30 * 60000 , default: false},
    { label: '60m', value: 60 * 60000, default: true },
  ]
};
function renderModeMenu(mode) {
  const container = d3.select('#timeSetting');
  container.selectAll('*').remove();

// if (mode === 'realTime') {
//   container.append('div')
//     .attr('class', 'col-6 mb-3')
//     .html(`
//       <label>Time Range</label>
//       <select class="form-control" id="realTimeRange">
//         ${TIME_RANGES.map(opt => `<option value="${opt.value}"${opt.default ? ' selected' : ''}>${opt.label}</option>`).join('')}
//       </select>
//     `);

//   container.append('div')
//     .attr('class', 'col-6 mb-3')
//     .html(`
//       <label>Interval</label>
//       <select class="form-control" id="realTimeInterval"></select>
//     `);

//   // Update interval options when time range changes
//   d3.select('#realTimeRange')
//     .on('change', function () {
//       const selected = +this.value;
//       const intervalOptions = INTERVALS[selected] || [];
//       const intervalSelect = d3.select('#realTimeInterval');
//       intervalSelect.selectAll('option').remove();
//       intervalOptions.forEach(opt => {
//         intervalSelect.append('option')
//           .attr('value', opt.value)
//           .text(opt.label)
//           .property('selected', !!opt.default);
//       });

//       startRealTimePolling(); // trigger reload on range change
      
//     })
//     .dispatch('change'); // trigger once on load

//   // Trigger reload when interval is changed
//   d3.select('#realTimeInterval').on('change', startRealTimePolling);
// } else  {
//   container.append('div')
//     .attr('class', 'col-6 mb-3')
//     .html(`
//       <label>Start Time</label>
//       <input type="datetime-local" class="form-control" id="startTime" value="2025-06-15T12:00">
//     `);

//   container.append('div')
//     .attr('class', 'col-6 mb-3')
//     .html(`
//       <label>End Time</label>
//       <input type="datetime-local" class="form-control" id="endTime" value="2025-06-15T14:00">
//     `);

//   d3.select('#startTime').on('change', loadHistoricalData);
//   d3.select('#endTime').on('change', loadHistoricalData);
// }
if (mode === 'realTime') {
  container.append('div')
    .attr('class', 'col-6 mb-3')
    .html(`
      <label>Time Range</label>
      <select class="form-control" id="realTimeRange">
        ${TIME_RANGES.map(opt => `<option value="${opt.value}"${opt.default ? ' selected' : ''}>${opt.label}</option>`).join('')}
      </select>
    `);

  const intervalContainer = container.append('div')
    .attr('class', 'col-6 mb-3')
    .attr('id', 'intervalContainer')
    .html(`
      <label>Interval</label>
      <select class="form-control" id="realTimeInterval"></select>
    `);

  const startEndContainer = container.append('div')
    .attr('class', 'col-12 row')
    .attr('id', 'startEndContainer')
    .style('display', 'none');

  startEndContainer.append('div')
    .attr('class', 'col-6 mb-3')
    .html(`
      <label>Start Time</label>
      <input type="datetime-local" class="form-control" id="startTime" value="2025-06-15T12:00">
    `);

  startEndContainer.append('div')
    .attr('class', 'col-6 mb-3')
    .html(`
      <label>End Time</label>
      <input type="datetime-local" class="form-control" id="endTime" value="2025-06-15T14:00">
    `);

  const processBtnContainer = startEndContainer.append('div')
    .attr('class', 'col-12 mb-3 d-flex justify-content-end')
    .html(`
      <button id="processBtn" class="btn btn-primary">Process</button>
    `);

  // Hide process button initially
  d3.select('#processBtn').style('display', 'none');

  // Bind action to process button
  d3.select('#processBtn').on('click', loadHistoricalData);

  // Handle time range changes
  d3.select('#realTimeRange')
    .on('change', function () {
      const selected = +this.value;
      const intervalSelect = d3.select('#realTimeInterval');
      const intervalBox = d3.select('#intervalContainer');
      const startEndBox = d3.select('#startEndContainer');
      const processBtn = d3.select('#processBtn');

      if (selected === -1) {
        intervalBox.style('display', 'none');
        startEndBox.style('display', null);      // show time inputs
        processBtn.style('display', null);       // show Process button
      } else if (selected === -3) {
        intervalBox.style('display', 'none');
        startEndBox.style('display', 'none');
        processBtn.style('display', 'none');
        loadSampleData()
      }
      else {
        intervalBox.style('display', null);      // show interval
        startEndBox.style('display', 'none');    // hide time inputs
        processBtn.style('display', 'none');     // hide button

        // Update interval options
        const intervalOptions = INTERVALS[selected] || [];
        intervalSelect.selectAll('option').remove();
        intervalOptions.forEach(opt => {
          intervalSelect.append('option')
            .attr('value', opt.value)
            .text(opt.label)
            .property('selected', !!opt.default);
        });

        startRealTimePolling(); // trigger reload on range change
      }
    })
    .dispatch('change'); // trigger once on load

  d3.select('#realTimeInterval').on('change', startRealTimePolling);
}


}

function buildRealTimeParams(rangeValue, intervalValue) {
    const now = new Date();
  const durationMs = rangeValue < 0
    ? Math.abs(rangeValue) * 60 * 60 * 1000  // hours
    : rangeValue * 24 * 60 * 60 * 1000;      // days
  const start = new Date(now - durationMs);
  const format = d3.timeFormat("%Y-%m-%d %H:%M:%S%Z");
  const formatInterval = intervalValue < 60000 ? (intervalValue / 1000) + 's' : (intervalValue / 60000) + 'm';
  return {
    start: format(start),
    end: format(now),
    interval: formatInterval,
    aggregation: "max",
    nodelist: "10.101.93.[1-8]",
    metrics: [
      "GPU_Usage", "GPU_PowerConsumption", "GPU_MemoryUsage", "GPU_Temperature",
      "CPU_Usage", "CPU_PowerConsumption", "CPU_Temperature",
      "DRAM_Usage", "DRAM_PowerConsumption",
      "System_PowerConsumption", "Jobs_Info", "NodeJobs_Correlation", "Nodes_State"
    ],
    compression: false
  };
}

function buildHistoricalParams(startStr, endStr) {
  const parse = d3.timeParse('%Y-%m-%dT%H:%M');
  const format = d3.timeFormat('%Y-%m-%d %H:%M:%S%Z');
  const start = parse(startStr);
  const end = parse(endStr);
  const durationMs = end - start;
  let interval;
  if (durationMs <= 6 * 60 * 60 * 1000) interval = '5m';
  else if (durationMs <= 24 * 60 * 60 * 1000) interval = '10m';
  else if (durationMs <= 3 * 24 * 60 * 60 * 1000) interval = '30m';
  else interval = '60m';
  return {
    start: format(start),
    end: format(end),
    interval: interval,
    aggregation: "max",
    nodelist: "10.101.93.[1-8]",
    metrics: [
      "GPU_Usage", "GPU_PowerConsumption", "GPU_MemoryUsage", "GPU_Temperature",
      "CPU_Usage", "CPU_PowerConsumption", "CPU_Temperature",
      "DRAM_Usage", "DRAM_PowerConsumption",
      "System_PowerConsumption", "Jobs_Info", "NodeJobs_Correlation", "Nodes_State"
    ],
    compression: false
  };
}

function fetchDataAndProcess_old(Params) {
  return fetch('http://narumuu.ttu.edu/api/h100/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Params)
    }).then(res => res.json()).then(apiData => {
        console.log('API Data:', apiData);
        const timeMap = new Map();
        const allTimes = Array.from(new Set(apiData.nodes.map(d => d.time))).sort((a, b) => a - b);
        allTimes.forEach((t, i) => timeMap.set(t, i));

        const nodes_info = {};
        const jobs_info = {};

        apiData.nodes.forEach(entry => {
            const node = entry.node;
            const idx = timeMap.get(entry.time);
            if (!nodes_info[node]) {
                const len = allTimes.length;
                nodes_info[node] = {
                    cpus: Array(len).fill().map(() => []),
                    job_id: Array(len).fill().map(() => []),
                    system_power: Array(len).fill().map(() => []),
                    gpu_power: Array(len).fill().map(() => []),
                    cpu_power: Array(len).fill().map(() => []),
                    gpu_mem: Array(len).fill().map(() => []),
                    gpu_usage: Array(len).fill().map(() => []),
                    cpu_usage: Array(len).fill().map(() => []),
                    dram_usage: Array(len).fill().map(() => []),
                    dram_power: Array(len).fill().map(() => []),
                    user: [],
                    jobName: []
                };
            }

            nodes_info[node].cpus[idx] = entry.cores ?? [];
            nodes_info[node].job_id[idx] = entry.jobs ?? [];
            nodes_info[node].system_power[idx] = entry.system_power_consumption ?? [];
            nodes_info[node].gpu_power[idx] = (entry.gpu_power_consumption ?? []).map(v => v / 1000);
            nodes_info[node].cpu_power[idx] = entry.cpu_power_consumption ?? [];
            nodes_info[node].gpu_mem[idx] = entry.gpu_memory_usage ?? [];
            nodes_info[node].gpu_usage[idx] = entry.gpu_usage ?? [];
            nodes_info[node].cpu_usage[idx] = entry.cpu_usage ?? [];
            nodes_info[node].dram_usage[idx] = entry.dram_usage ?? [];
nodes_info[node].dram_power[idx] = (entry.dram_power_consumption ?? []).map(v => v / 1000);
        });

        apiData.job_details.forEach(job => {
            jobs_info[job.job_id] = {
                job_id: job.job_id,
                job_name: job.name,
                user_name: job.user_name,
                user_id: job.user_id,
                submit_time: job.submit_time * 1e9,
                start_time: job.start_time * 1e9,
                end_time: job.end_time * 1e9,
                node_list: job.nodes ?? [],
                cpu_cores: job.cpus,
                array_task_id: job.array_task_id,
                array_job_id: job.array_job_id
            };
            for (const node of job.nodes ?? []) {
                if (nodes_info[node]) {
                    if (!nodes_info[node].user.includes(job.user_name)) {
                        nodes_info[node].user.push(job.user_name);
                    }
                    if (!nodes_info[node].jobName.includes(job.name)) {
                        nodes_info[node].jobName.push(job.name);
                    }
                }
            }
        });

        const jobObjArr = {};
        Object.values(jobs_info).forEach(d => {
            if (d.array_task_id != null && d.array_job_id != null) {
                const arrayId = 'array' + d.array_job_id;
                if (!jobObjArr[arrayId]) {
                    jobObjArr[arrayId] = {
                        isJobarray: true,
                        job_id: arrayId,
                        job_ids: {},
                        finish_time: null,
                        job_name: d.job_name,
                        node_list: [],
                        node_list_obj: {},
                        total_nodes: 0,
                        user_name: d.user_name,
                        user_id: d.user_id,
                        start_time: d.start_time,
                        submit_time: d.submit_time
                    };
                }
                jobObjArr[arrayId].job_ids[d.job_id] = d;
                jobObjArr[arrayId].start_time = Math.min(jobObjArr[arrayId].start_time, d.start_time);
                jobObjArr[arrayId].submit_time = Math.min(jobObjArr[arrayId].submit_time, d.submit_time);
            }
        });
        Object.entries(jobObjArr).forEach(([id, job]) => jobs_info[id] = job);

        const final_jobs_info = {};
        Object.entries(nodes_info).forEach(([comp, d]) => {
            d.job_id.forEach((jobList, ti) => {
                jobList.forEach((jid, i) => {
                    if (!final_jobs_info[jid]) {
                        final_jobs_info[jid] = jobs_info[jid] ?? {
                            job_id: jid,
                            cpu_cores: d.cpus[ti]?.[i],
                            finish_time: null,
                            job_name: '' + jid,
                            node_list: [],
                            node_list_obj: {},
                            start_time: allTimes[ti] * 1e9,
                            submit_time: allTimes[ti] * 1e9,
                            total_nodes: 0,
                            user_name: "unknown",
                            user_id: -1
                        };
                        final_jobs_info[jid].node_list_obj = {};
                        final_jobs_info[jid].node_list = [];
                        final_jobs_info[jid].total_nodes = 0;
                    }

                    const arrayId = final_jobs_info[jid].job_array_id;
                    if (arrayId && !final_jobs_info[arrayId]) {
                        final_jobs_info[arrayId] = jobs_info[arrayId];
                        final_jobs_info[arrayId].node_list_obj = {};
                        final_jobs_info[arrayId].node_list = [];
                        final_jobs_info[arrayId].total_nodes = 0;
                    }

                    if (!final_jobs_info[jid].node_list_obj[comp]) {
                        final_jobs_info[jid].node_list_obj[comp] = d.cpus[ti]?.[i] ?? 0;
                        final_jobs_info[jid].node_list.push(comp);
                        final_jobs_info[jid].total_nodes++;
                    }

                    final_jobs_info[jid].finish_time = allTimes[ti] * 1e9;

                    if (arrayId) {
                        if (!final_jobs_info[arrayId].node_list_obj[comp]) {
                            final_jobs_info[arrayId].node_list_obj[comp] = d.cpus[ti]?.[i] ?? 0;
                            final_jobs_info[arrayId].node_list.push(comp);
                            final_jobs_info[arrayId].total_nodes++;
                        }
                        final_jobs_info[arrayId].finish_time = allTimes[ti] * 1e9;
                    }
                });
            });
        });

        return {
            time_stamp: allTimes.map(t => t * 1e9),
            nodes_info,
            jobs_info: final_jobs_info
        };
    })
}
async function fetchDataAndProcess(Params, isRealTime = true) {
  let apiData;

  if (isRealTime) {
    // Real-time: Fetch from API
    apiData = await fetch('http://narumuu.ttu.edu/api/h100/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Params)
    }).then(res => res.json());
  } else {
    // Historical mode: Load from local file
    apiData = await fetch('src/data/response_1753356572139.json') // replace with your actual local path
      .then(res => res.json());
  }

  const timeMap = new Map();
        const allTimes = Array.from(new Set(apiData.nodes.map(d => d.time))).sort((a, b) => a - b);
        allTimes.forEach((t, i) => timeMap.set(t, i));

        const nodes_info = {};
        const jobs_info = {};

        apiData.nodes.forEach(entry => {
            const node = entry.node;
            const idx = timeMap.get(entry.time);
            if (!nodes_info[node]) {
                const len = allTimes.length;
                nodes_info[node] = {
                    cpus: Array(len).fill().map(() => []),
                    job_id: Array(len).fill().map(() => []),
                    system_power: Array(len).fill().map(() => []),
                    gpu_power: Array(len).fill().map(() => []),
                    cpu_power: Array(len).fill().map(() => []),
                    gpu_mem: Array(len).fill().map(() => []),
                    gpu_usage: Array(len).fill().map(() => []),
                    cpu_usage: Array(len).fill().map(() => []),
                    dram_usage: Array(len).fill().map(() => []),
                    dram_power: Array(len).fill().map(() => []),
                    user: [],
                    jobName: []
                };
            }

            nodes_info[node].cpus[idx] = entry.cores ?? [];
            nodes_info[node].job_id[idx] = entry.jobs ?? [];
            nodes_info[node].system_power[idx] = entry.system_power_consumption ?? [];
            nodes_info[node].gpu_power[idx] = (entry.gpu_power_consumption ?? []).map(v => v / 1000);
            nodes_info[node].cpu_power[idx] = entry.cpu_power_consumption ?? [];
            nodes_info[node].gpu_mem[idx] = entry.gpu_memory_usage ?? [];
            nodes_info[node].gpu_usage[idx] = entry.gpu_usage ?? [];
            nodes_info[node].cpu_usage[idx] = entry.cpu_usage ?? [];
            nodes_info[node].dram_usage[idx] = entry.dram_usage ?? [];
nodes_info[node].dram_power[idx] = (entry.dram_power_consumption ?? []).map(v => v / 1000);
        });

        apiData.job_details.forEach(job => {
            jobs_info[job.job_id] = {
                job_id: job.job_id,
                job_name: job.name,
                user_name: job.user_name,
                user_id: job.user_id,
                submit_time: job.submit_time * 1e9,
                start_time: job.start_time * 1e9,
                end_time: job.end_time * 1e9,
                node_list: job.nodes ?? [],
                cpu_cores: job.cpus,
                array_task_id: job.array_task_id,
                array_job_id: job.array_job_id
            };
            for (const node of job.nodes ?? []) {
                if (nodes_info[node]) {
                    if (!nodes_info[node].user.includes(job.user_name)) {
                        nodes_info[node].user.push(job.user_name);
                    }
                    if (!nodes_info[node].jobName.includes(job.name)) {
                        nodes_info[node].jobName.push(job.name);
                    }
                }
            }
        });

        const jobObjArr = {};
        Object.values(jobs_info).forEach(d => {
            if (d.array_task_id != null && d.array_job_id != null) {
                const arrayId = 'array' + d.array_job_id;
                if (!jobObjArr[arrayId]) {
                    jobObjArr[arrayId] = {
                        isJobarray: true,
                        job_id: arrayId,
                        job_ids: {},
                        finish_time: null,
                        job_name: d.job_name,
                        node_list: [],
                        node_list_obj: {},
                        total_nodes: 0,
                        user_name: d.user_name,
                        user_id: d.user_id,
                        start_time: d.start_time,
                        submit_time: d.submit_time
                    };
                }
                jobObjArr[arrayId].job_ids[d.job_id] = d;
                jobObjArr[arrayId].start_time = Math.min(jobObjArr[arrayId].start_time, d.start_time);
                jobObjArr[arrayId].submit_time = Math.min(jobObjArr[arrayId].submit_time, d.submit_time);
            }
        });
        Object.entries(jobObjArr).forEach(([id, job]) => jobs_info[id] = job);

        const final_jobs_info = {};
        Object.entries(nodes_info).forEach(([comp, d]) => {
            d.job_id.forEach((jobList, ti) => {
                jobList.forEach((jid, i) => {
                    if (!final_jobs_info[jid]) {
                        final_jobs_info[jid] = jobs_info[jid] ?? {
                            job_id: jid,
                            cpu_cores: d.cpus[ti]?.[i],
                            finish_time: null,
                            job_name: '' + jid,
                            node_list: [],
                            node_list_obj: {},
                            start_time: allTimes[ti] * 1e9,
                            submit_time: allTimes[ti] * 1e9,
                            total_nodes: 0,
                            user_name: "unknown",
                            user_id: -1
                        };
                        final_jobs_info[jid].node_list_obj = {};
                        final_jobs_info[jid].node_list = [];
                        final_jobs_info[jid].total_nodes = 0;
                    }

                    const arrayId = final_jobs_info[jid].job_array_id;
                    if (arrayId && !final_jobs_info[arrayId]) {
                        final_jobs_info[arrayId] = jobs_info[arrayId];
                        final_jobs_info[arrayId].node_list_obj = {};
                        final_jobs_info[arrayId].node_list = [];
                        final_jobs_info[arrayId].total_nodes = 0;
                    }

                    if (!final_jobs_info[jid].node_list_obj[comp]) {
                        final_jobs_info[jid].node_list_obj[comp] = d.cpus[ti]?.[i] ?? 0;
                        final_jobs_info[jid].node_list.push(comp);
                        final_jobs_info[jid].total_nodes++;
                    }

                    final_jobs_info[jid].finish_time = allTimes[ti] * 1e9;

                    if (arrayId) {
                        if (!final_jobs_info[arrayId].node_list_obj[comp]) {
                            final_jobs_info[arrayId].node_list_obj[comp] = d.cpus[ti]?.[i] ?? 0;
                            final_jobs_info[arrayId].node_list.push(comp);
                            final_jobs_info[arrayId].total_nodes++;
                        }
                        final_jobs_info[arrayId].finish_time = allTimes[ti] * 1e9;
                    }
                });
            });
        });

        return {
            time_stamp: allTimes.map(t => t * 1e9),
            nodes_info,
            jobs_info: final_jobs_info
        };
}
let realTimeIntervalId;
function startRealTimePolling(isRealTime = true) {
  const range = +document.getElementById('realTimeRange').value;
  const intervalMs = +document.getElementById('realTimeInterval').value;
  if (realTimeIntervalId) clearInterval(realTimeIntervalId);
  function fetchAndUpdate() {
    const realTimeParams = buildRealTimeParams(range, intervalMs);
    request = new Simulation(fetchDataAndProcess(realTimeParams, isRealTime));
  }
  fetchAndUpdate();
  initdraw();
    initTimeElement();
  realTimeIntervalId = setInterval(fetchAndUpdate, intervalMs);
}
function loadHistoricalData() {
  if (realTimeIntervalId) clearInterval(realTimeIntervalId);

  const start = document.getElementById('startTime')?.value;
  const end = document.getElementById('endTime')?.value;

  if (!start || !end) {
    console.warn('Start or End time is missing.');
    return;
  }

  const historicalParams = buildHistoricalParams(start, end);
  request = new Simulation(fetchDataAndProcess(historicalParams));
  initdraw();
    initTimeElement();
}

function loadSampleData() {
  if (realTimeIntervalId) clearInterval(realTimeIntervalId);

  // const start = document.getElementById('startTime')?.value;
  // const end = document.getElementById('endTime')?.value;

  // if (!start || !end) {
  //   console.warn('Start or End time is missing.');
  //   return;
  // }

  // const historicalParams = buildHistoricalParams(start, end);
  // request = new Simulation(fetchDataAndProcess(historicalParams));
  request = new Simulation(fetchDataAndProcess({}, false));
  initdraw();
    initTimeElement();
}
d3.selectAll('#navMode li a').on('click', function () {
  const mode = d3.select(this.parentNode).classed('realtime') ? 'realTime' : 'historical';
  renderModeMenu(mode);
  setTimeout(() => {
    if (mode === 'realTime') {
      startRealTimePolling();
    } else {
      //  loadHistoricalData();
       loadSampleData();
    }
  }, 100);
});

// const params = new URLSearchParams(window.location.search);
// if (params.get('mode') === 'realTime') {
//   d3.select('#navMode').selectAll('li a').classed('active', false);
//   d3.select('#navMode').select('li.realtime a').classed('active', true);
//   renderModeMenu('realTime');
// //   startRealTimePolling();
// } else {
//   d3.select('#navMode').selectAll('li a').classed('active', false);
//   d3.select('#navMode').select('li.demo a').classed('active', true);
//   renderModeMenu('historical');
// }

$(document).ready(function () {
    try {
        // let mode = window.location.search.substring(1).split("mode=")[1].split('&')[0].replace(/%20/g,' '); // get data name after app=
        let command = window.location.search.substring(1).split("&").map(d => d.split('=')); // get data name after app=
        command = _.object(command.map(d => d[0]), command.map(d => d[1])); // get data name after app=

        if (command.service !== undefined && _.isNumber(+command.service))
            serviceSelected = +command.service;
        if (command.metric !== undefined && _.isNumber(+command.metric))
            serviceSelected = +command.metric;
        serviceListattr = [
            "system_power", "gpu_power", "cpu_power", "dram_power",
            "gpu_mem", "gpu_usage", "cpu_usage", "dram_usage",
        ];

        serviceLists = serviceListattr.map((key, index) => ({
            text: key,
            id: index,
            enable: true,
            sub: [{
                text: key,
                id: 0,
                enable: true,
                idroot: index,
                angle: 0,
                range: [0, 3000]
            }]
        }));
        serviceFullList = [];
        serviceLists.forEach(s => s.sub.forEach(ss => serviceFullList.push(ss)));
        serviceList_selected = serviceListattr.map((key, i) => ({
            text: key,
            index: i
        }));
        alternative_service = [...serviceListattr];
        alternative_scale = Array(serviceListattr.length).fill(1);
            renderModeMenu('realTime');
        // if (mode === 'realTime') {
        //     startRealTimePolling();
        // } else {
            loadSampleData();
        // }
    } catch (e) {
        request = new Simulation('src/data/922020-932020-145000.json');
    }
    updateProcess({percentage: 5, text: 'Load UI...'})
    initMenu();
    updateProcess({percentage: 15, text: 'Preprocess data...'});
    // initdraw();
    // initTimeElement();
});
function handleInputSlumrData(data) {
    const jobObjArr = {};
    Object.keys(data.jobs_info).forEach(key => {
        const d = data.jobs_info[key];
        d.job_id = d.job_id || key;
        d["submit_time"] = d["submit_time"] * 1000000000;
        d["start_time"] = d["start_time"] * 1000000000;
        d["end_time"] = d["end_time"] * 1000000000;
        d.node_list = d.nodes.slice();
        d.job_name = d.name;
        if (d.array_task_id !== null && d.array_job_id) {
            d.job_array_id = 'array' + d.array_job_id;
            if (!jobObjArr[d.job_array_id]) {
                jobObjArr[d.job_array_id] = {
                    isJobarray: true,
                    job_id: d.job_array_id,
                    job_ids: {},
                    "finish_time": null,
                    "end_time": null,
                    "job_name": d.name,
                    "node_list": [],
                    "node_list_obj": {},
                    "total_nodes": 0,
                    "user_name": d.user_name,
                    start_time: d.start_time,
                    submit_time: d.submit_time
                }
                jobObjArr[d.job_array_id].job_ids[d.job_id] = d;
            } else {
                jobObjArr[d.job_array_id].job_ids[d.job_id] = d;
                if (d.start_time < jobObjArr[d.job_array_id].start_time)
                    jobObjArr[d.job_array_id].start_time = d.start_time;
                if (d.submit_time < jobObjArr[d.job_array_id].submit_time)
                    jobObjArr[d.job_array_id].submit_time = d.submit_time;
            }
        }
    });
    Object.keys(jobObjArr).forEach(j => {
        data.jobs_info[j] = jobObjArr[j];
    })
    const jobs_info = {};
    Object.keys(data.nodes_info).forEach(comp => {
        const d = data.nodes_info[comp]
        d.job_id = d.jobs;
        delete d.jobs;
        d.job_id.forEach((js, ti) => {
            if (!js) {
                d.job_id[ti] = [];
                js = d.job_id[ti];
            }
            js.forEach((j, i) => {
                if (data.jobs_info[j] && (!jobs_info[j])) {
                    jobs_info[j] = data.jobs_info[j];
                    jobs_info[j].node_list_obj = {};
                    jobs_info[j].node_list = [];
                    jobs_info[j].total_nodes = 0;
                } else if (!jobs_info[j]) {
                    jobs_info[j] = {
                        "job_id": j,
                        "cpu_cores": d.cpus[ti][i],
                        "finish_time": null,
                        "end_time": null,
                        "job_name": '' + j,
                        "node_list": [],
                        "node_list_obj": {},
                        "start_time": data.time_stamp[i],
                        "submit_time": data.time_stamp[i],
                        "total_nodes": 0,
                        "user_name": "unknown",
                        user_id: -1
                    }
                }
                const job_array_id = jobs_info[j].job_array_id;
                if (job_array_id && (!jobs_info[job_array_id])) {
                    jobs_info[job_array_id] = data.jobs_info[job_array_id];
                    jobs_info[job_array_id].node_list_obj = {};
                    jobs_info[job_array_id].node_list = [];
                    jobs_info[job_array_id].total_nodes = 0;
                }
                if (!jobs_info[j].node_list_obj[comp]) {
                    jobs_info[j].node_list_obj[comp] = (d.cpus && d.cpus[ti]) ? d.cpus[ti][i] : 1;
                    jobs_info[j].node_list.push(comp);
                    jobs_info[j].total_nodes++;
                }

                jobs_info[j].finish_time = data.time_stamp[i];
                if (job_array_id) {
                    if (!jobs_info[job_array_id].node_list_obj[comp]) {
                        jobs_info[job_array_id].node_list_obj[comp] = (d.cpus && d.cpus[ti]) ? d.cpus[ti][i] : 1;
                        jobs_info[job_array_id].node_list.push(comp);
                        jobs_info[job_array_id].total_nodes++;
                    }
                    jobs_info[job_array_id].finish_time = data.time_stamp[i];
                }
            })
        })
    });
    console.log(Object.keys(data.jobs_info).length, Object.keys(jobs_info).length)
    data.jobs_info = jobs_info;
    return data;
}







// $(document).ready(function () {

//     try {
//         // let mode = window.location.search.substring(1).split("mode=")[1].split('&')[0].replace(/%20/g,' '); // get data name after app=
//         let command = window.location.search.substring(1).split("&").map(d => d.split('=')); // get data name after app=
//         command = _.object(command.map(d => d[0]), command.map(d => d[1])); // get data name after app=

//         if (command.service !== undefined && _.isNumber(+command.service))
//             serviceSelected = +command.service;
//         if (command.metric !== undefined && _.isNumber(+command.metric))
//             serviceSelected = +command.metric;
//         if (command.mode === 'realTime') {
//             // set up ui
//             d3.select('#navMode').selectAll('li a').classed('active', false);
//             d3.select('#navMode').select('li.realtime a').classed('active', true);
//             //---------
//             request = new Simulation();
//         } else {
//             // set up ui
//             d3.select('#navMode').selectAll('li').classed('active', false);
//             d3.select('#navMode').select('li.demo a').classed('active', true);
//             // let url = '../HiperView/data/814_821_2020.json';
//             // let url = '../jobviewer/src/data/922020-932020-145000.json';
//             // let url = 'src/data/nocona_aggregated.csv';
//             // let url = 'src/data/aggregated_metrics_6h.json';
//             // let url = 'src/data/aggregated_metrics_04_28.json';
//             // let url = 'src/data/aggregated_metrics_05_12.json'; // demoable
//             // let url = 'src/data/aggregated_metrics_04-28_L.json';
//             let url = '../HiperView/data/aggregated_metrics_2021-06-17T06_00_00_2021-06-17T12_00_00.json';
//             //---------
//             // request = new Simulation('../HiperView/data/7222020.json');
//             // request = new Simulation('../HiperView/data/Tue Aug 04 2020 16_00_00 GMT-0500 (Central Daylight Time) Thu Aug 06 2020 16_00_00 GMT-0500 (Central Daylight Time).json');
//             // request = new Simulation('../HiperView/data/8122020.json');
//             // request = new Simulation('../HiperView/data/814_821_2020.json');
//             debugger
//             serviceListattr = ["power","mem_power","mem_usage"];
//             serviceLists = [{
//                 "text": "power",
//                 "id": 0,
//                 "enable": true,
//                 "sub": [{"text": "power", "id": 0, "enable": true, "idroot": 0, "angle": 0, "range": [0, 800]}]
//             },{
//                 "text": "mem_power",
//                 "id": 1,
//                 "enable": true,
//                 "sub": [{"text": "mem_power", "id": 0, "enable": true, "idroot": 1, "angle": 0, "range": [0, 300]}]
//             },{
//                 "text": "mem_usage",
//                 "id": 2,
//                 "enable": true,
//                 "sub": [{"text": "mem_usage", "id": 0, "enable": true, "idroot": 2, "angle": 0, "range": [0, 100]}]
//             }];
//             serviceFullList = [];
//             serviceLists.forEach(s=>s.sub.forEach(ss=>serviceFullList.push(ss)));

//             serviceList_selected = [{"text": "power", "index": 0},{"text": "mem_power", "index": 1},{"text": "mem_usage", "index": 2}];
//             alternative_service = ["power","mem_power","mem_usage"];
//             alternative_scale = [1,1,1];
//             request = new Simulation(d3.json(url).then(d => {
//                 // d=d.slice(0,1920)
//                 const data = d;
//                 // d3.select('#dataTime').text(new Date(data.time_stamp[0]* 1000).toDateString());
//                 getServiceSet(data.nodes_info);
//                 // serviceControl();
//                 data.time_stamp = data.time_stamp.map(d => d * 1000000000);
//                 return handleInputSlumrData(data);
//             }));
//         }
//     } catch (e) {
//         // request = new Simulation('../HiperView/data/8122020.json');
//         // request = new Simulation('../HiperView/data/814_821_2020.json');
//         // request = new Simulation('../HiperView/data/9214_9215_2020.json');
//         request = new Simulation('src/data/922020-932020-145000.json');
//         // request = new Simulation('../HiperView/data/Tue Aug 04 2020 16_00_00 GMT-0500 (Central Daylight Time) Thu Aug 06 2020 16_00_00 GMT-0500 (Central Daylight Time).json');
//         // request = new Simulation('../HiperView/data/Tue Aug 04 2020 15_45_00 GMT-0500 (Central Daylight Time) Thu Aug 06 2020 16_00_00 GMT-0500 (Central Daylight Time).json');
//     }
//     updateProcess({percentage: 5, text: 'Load UI...'})
//     initMenu();
//     updateProcess({percentage: 15, text: 'Preprocess data...'});
//     initdraw();
//     toggleControlpanel();
//     initTimeElement();
//     // queryLayout().then(()=>request.request());
// });

function initTimeElement() {
    // request.onFinishQuery.push(queryData);
    request.onDataChange.push((data) => {
        updateProcess({percentage: 50, text: 'Preprocess data'})
        setTimeout(() => {
            d3.select('#dataTime').text(new Date(data.time_stamp[0]).toDateString());
            serviceControl();
            handleRankingData(data);
            updateProcess({percentage: 80, text: 'Preprocess data'});
            $('#JobFilterThreshold').val(Object.keys(Layout.jobsStatic).length);
            drawJobList();
            initdrawGantt();
            drawGantt();
            // timelineControl.play.bind(timelineControl)();
            drawUserList();
            drawComputeList();
            updateProcess();
        }, 0);
    });
}
