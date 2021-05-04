var timeArcopt = {width:1400,height:700, margin: {top: 10, right: 10, bottom: 0, left: 350},
    offset: {top: 0}};
let TimeArcSetting = function (){
    let graphicopt = {
        contain: '#Chartcontent',
        margin: {top: 10, right: 10, bottom: 0, left: 200},
        offset: {top: 0},
        width: 1500,
        height: 1000,
        scalezoom: 1,
        widthView: function () {
            return this.width * this.scalezoom
        },
        heightView: function () {
            return this.height * this.scalezoom
        },
        widthG: function () {
            return this.widthView() - this.margin.left - this.margin.right
        },
        heightG: function () {
            return this.heightView() - this.margin.top - this.margin.bottom
        },
        display: {
            links: {
                'stroke-opacity': 0.5
            }
        }
    };
    let scheme={};
    let contain = d3.select(graphicopt.contain);
    let master = {};
    let TimeArc  = d3.TimeArc();
    let isFirst = true;
    let catergogryList=[{key: 'user', value: {colororder: 0}},{key: 'compute', value: {colororder: 1}},{key: 'rack', value: {colororder: 2}}];
    let layout={};
    master.timearc = TimeArc;
    master.reset = function(){

        return master;
    };
    master.mouseover = [];
    master.mouseover.dict={};
    master.mouseout = [];
    master.mouseout.dict={};
    master.click = [];
    master.click.dict={};
    master.mouseoverAdd = function(id,func){
        if (master.mouseover.dict[id]!==undefined)
            master.mouseover[master.mouseover.dict[id]] = func;
        else {
            master.mouseover.push(func)
            master.mouseover.dict[id] = master.mouseover.length-1;
        }
    }
    master.mouseoutAdd = function(id,func){
        if (master.mouseout.dict[id]!==undefined)
            master.mouseout[master.mouseout.dict[id]] = func;
        else {
            master.mouseout.push(func)
            master.mouseout.dict[id] = master.mouseout.length-1;
        }
    }
    master.clickAdd = function(id,func){
        if (master.click.dict[id]!==undefined)
            master.click[master.click.dict[id]] = func;
        else {
            master.click.push(func)
            master.click.dict[id] = master.click.length-1;
        }
    }
    master.init = function () {
        TimeArc.svg(contain)
            .graphicopt(graphicopt)
            // .mouseover(onmouseoverRadar).mouseout(onmouseleaveRadar)
            .catergogryList(catergogryList)
            .init();

        return master;
    };

    master.stop = function (){

    };

    master.draw = function () {
        if (isFirst) {
            master.init();
            isFirst = false;
        }

        TimeArc.runopt(scheme).data(scheme.data).draw();

        updateProcess();
    };
    master.graphicopt = function (__) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in __) {
                if ('undefined' !== typeof __[i]) {
                    graphicopt[i] = __[i];
                }
            }
            TimeArc.graphicopt(graphicopt);
            return master;
        }else {
            return graphicopt;
        }

    };
    let isNeedRender = true;
    master.scheme = function (__) {
        //Put all of the options into a variable called graphicopt
        if (arguments.length) {
            for (let i in __) {
                if ('undefined' !== typeof __[i]) {
                    scheme[i] = __[i];
                }
            }
            return master;
        }else {
            return scheme;
        }

    };
    master.getColorScale = function(_data) {
        return arguments.length?(getColorScale=_data?_data:function(){return color},master):getColorScale;
    };
    master.schema = function (){
        isNeedRender = true;
    };
    master.layout = function(d){
        layout = {};
        d.forEach(k=>layout[k.Name]= _.flatten(k.value).filter(d=>d))
        TimeArc.classMap(layout)
    };
    return master;
};
function handle_data_timeArc () {
    debugger
    const graphicopt = subObject.graphicopt();
    const keys = Layout.timespan//.slice(0,10);
    let scheme ={limitColums : [0,10],
        limitTime : [keys[0],keys[keys.length-1]],
        time: {rate:5,unit:'Minute'},
        // timeLink: {rate:5,unit:'Minute'},
        timeformat: d3.timeDay.every(1),
    };
    let dataObj = {};
    scheme.data=[];
    scheme.data.timespan = keys;

    let data = Layout.jobCompTimeline;

    let graph = (()=> {
        let index = -1;
        let nodes = [];
        const nodeByKey = new Map;
        const indexByKey = new Map;
        const nodeLabel = new Map;
        let links = [];
        const nodeList = {};
        keys.forEach((k,ki)=>{
            for (const d of data) {
                if(d[k]){
                    const text = getUserName(d[k]);
                    const key = JSON.stringify([k, text]);
                    if (( graphicopt.showShareUser && (!(d[k]&&d[k].length>1)))|| nodeByKey.has(key))
                        continue // return
                    const node = {name: text,time:k,layer:ki,relatedLinks:[],element:d[k],id:++index};
                    if (!nodeLabel.has(text)) {
                        node.first = true;
                        nodeLabel.set(text, node);
                        nodeList[text] = [];
                        // color(text)
                    }
                    nodes.push(node);
                    nodeByKey.set(key, node);
                    indexByKey.set(key, index);
                    nodeList[text].push(node);
                }
            }
        })
        // nodes = _.shuffle(nodes)
        for (let i = 1; i < keys.length; ++i) {
            const a = keys[i - 1];
            const b = keys[i];
            const prefix = keys.slice(0, i + 1);
            const linkByKey = new Map;
            for (const d of data){
                const sourceName = JSON.stringify([a, getUserName(d[a])]);
                const targetName = JSON.stringify([b, getUserName(d[b])]);
                if (d[a] && d[b] && nodeByKey.get(sourceName) && nodeByKey.get(targetName)){
                    const names = [sourceName,targetName];
                    const category = {user:{}};
                    const key = JSON.stringify(names);
                    // const value = d.value || 1;
                    const value = d[a].total;
                    const arr = d.arr || [d.key];//just ad for testing
                    let link = linkByKey.get(key);
                    if (link) {
                        link.value += value;
                        // link.arr = [...(link.arr??[]),...arr];
                        link.arr = [link.value];
                        continue;
                    }
                    category.user[getUserName(d[a])] = value;
                    category.user[getUserName(d[b])] = value;
                    const date = b;
                    link = {
                        source: indexByKey.get(JSON.stringify([a, getUserName(d[a])])),
                        target: indexByKey.get(JSON.stringify([b, getUserName(d[b])])),
                        names,
                        category,
                        date,
                        id: d3.keys(category.user).join('_'),
                        arr,
                        value,
                        type:'startTime'
                    };
                    if (getUserName(d[a])!==getUserName(d[b])){
                        nodeByKey.get(JSON.stringify([a, getUserName(d[a])])).relatedLinks.push(link);
                        nodeByKey.get(JSON.stringify([b, getUserName(d[b])])).relatedLinks.push(link);
                    }
                    links.push(link);
                    linkByKey.set(key, link);
                }
            }
        }
        if (graphicopt.hideStable){
            let removeNodes = {};
            const listUser = {};
            d3.entries(nodeList).forEach(n=>{
                let removeList = {};
                if (!n.value.find(e=>{if (!e.relatedLinks.length) removeList[e.id] = true; return e.relatedLinks.length}))
                    d3.keys(removeList).forEach(k=>removeNodes[k] =true);
            })

            nodes = nodes.filter((n,index)=>{
                if (!removeNodes[n.id])
                    return true;
                else{
                    // listUser[n.name] = n;
                    return false;
                }
            });
            // console.log(listUser)
            links = links.filter(l=>!(removeNodes[l.source]||removeNodes[l.target]))
        }
        return {nodes, links};
    })();
    function getUserName(arr){
        return (arr&&arr.length)?('User '+arr.map(d=>d.key.replace('user','')).join(',')):'No user';
    }
    debugger
    scheme.data = graph.links;
    // sampleJobdata.forEach(j=>{
    //     function linkData(key) {
    //         let date = new Date(j[key]);
    //         if (date < scheme.data.timespan[0])
    //             date = scheme.data.timespan[0];
    //         const data = {category: {user: {}, compute: {}}, date: date};
    //         data.category.user[j.user] = 1;
    //         j.nodes.forEach(comp=>data.category.compute[comp] = 1)
    //         data.type = key;
    //         data.id = j.jobID;
    //         scheme.data.push(data);
    //     }
    //
    //     linkData('startTime');
    //     if (j.endTime)
    //         linkData('endTime');
    // });
    scheme.data.tsnedata = {};
    scheme.data.selectedService = 0;
    debugger
    // scheme.limitTime = d3.extent(scheme.data,d=>d.date)
    // scheme.limitTime = [sampleS.timespan[0],_.last(sampleS.timespan)]
    subObject.graphicopt(timeArcopt).scheme(scheme).draw();
}
