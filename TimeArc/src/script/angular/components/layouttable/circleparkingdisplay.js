'use strict';

/**
 * @ngdoc directive
 * @name vlui.directive:pasteDataset
 * @description
 * # pasteDataset
 */
angular.module('hpccApp')
    .directive('circleparkingDisplay', function (Layout,Dataset, Config, _) {
        return {
            templateUrl: 'src/script/angular/components/layouttable/circleparkingdisplay.html',
            restrict: 'E',
            require: '?^^modal',
            replace: true,
            scope: true,
            link: function postLink(scope, element, attrs, modalController) {
                // If this directive occurs within a a modal, give ourselves a way to close
                // that modal once the add button has been clicked
                function closeModal() {
                    if (modalController) {
                        modalController.close();
                    }
                }

                scope.service={};
                scope.service.serviceText = serviceFullList.map(d=>d.text);
                scope.users = d3.nest().key(d=>d.user)
                    .key(d=>d.jobID.split('.'))
                    .entries(Dataset.data.currentjob);
                scope.users.forEach(d=>d.computes=_.uniq(_.flattenDeep(d.values.map(e=>e.values.map(c=>c.nodes)))));
                scope.users.sort((a,b)=>b.computes.length-a.computes.length)
                scope.Layout = Layout;
                scope.width = 800;
                scope.height = 640;
                const width = scope.width;
                const height = scope.height;
                scope.color = (d)=>'#fff';
                scope.serviceSelected = 0;
                scope.colorItem = Config.getConfig().colorScheme?Config.getConfig().colorScheme.copy():d3.scaleSequential();
                scope.colorItem.domain(serviceFullList[scope.serviceSelected].range.slice().reverse());
                const colorItem = function(d){
                    if (d)
                        return scope.colorItem(d);
                    else
                        return '#afafaf';
                }

                    const color = d3.scaleLinear()
                        .domain([0, 5])
                        .range(["hsl(0,0%,100%)", "hsl(0,0%,71%)"])
                        .interpolate(d3.interpolateHcl);
                    scope.color = color;
                    function pack (data){
                        return d3.pack()
                            .size([width, height])
                            .padding(3)
                            (d3.hierarchy(data)
                                .sum(d => d.value)
                                .sort((a, b) => b.value - a.value))
                    }
                    const data = data2tree(Layout.data.groups);
                    sortDataby(serviceFullList[scope.serviceSelected].text);
                    let root = pack(data);
                    let focus = root;
                    let view;

                    const svg = d3.select(".circlepacking-svg-content")
                        .on("click", () => zoom(root));

                    let node;
                    svg.append('g').attr('class','circleG');

                    let label ;
                    svg.append("g")
                    .attr('class','label')
                    .style("font", "10px sans-serif")
                    .attr("pointer-events", "none")
                    .attr("text-anchor", "middle");
                    let value_text;
                    const gvalue = svg.append("g").attr('class','value')
                        .style("font", "10px sans-serif")
                        .attr("pointer-events", "none")
                        .attr("text-anchor", "middle");
                let currentZoomData  = [root.x, root.y, root.r * 2];
                updateNodes();

                function zoomTo(v,istransition) {
                    const k = width / v[2];

                    view = v;

                    label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
                    value_text.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
                    let node_animation;
                    if(istransition)
                        node_animation = node.transition();
                    else
                        node_animation = node;
                    node_animation.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
                    node.attr("r", d => d.r * k);
                    return v
                }

                    function zoom(d) {
                        const focus0 = focus;

                        focus = d;

                        const transition = svg.transition()
                            .duration(d3.event.altKey ? 7500 : 750)
                            .tween("zoom", d => {
                                const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
                                return t => currentZoomData = zoomTo(i(t));
                            });

                        label
                            .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
                            .transition(transition)
                            .style("fill-opacity", d => d.parent === focus ? 1 : 0)
                            .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
                            .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
                        value_text
                            .transition(transition)
                            .attr('dy',function(d) { if (d.parent === focus) return 15; else return 0; })

                    }

                    function data2tree(data){
                        return {name:"__main__",children:data.map(d=>(
                                {
                                    name:d.Name,
                                    children:_.flatten(d.value)
                                        .filter(d=>d!==null)
                                        .map(d=>{
                                            const item = {
                                                name:d,
                                                value:1,
                                                metrics:{}
                                            };
                                            serviceFullList.forEach(s=>item.metrics[s.text]=_.last(Dataset.data.sampleS[d][serviceListattr[s.idroot]])[s.id]);
                                            return item;
                                        })
                                }))
                        };
                    }
                function updateNode(node){
                    return node
                        .attr("fill", d => {
                            if(d.children) {
                                d.color =  color(d.depth);
                                return d.color;
                            }else {
                                d.color = colorItem(d.data.metrics[serviceFullList[scope.serviceSelected].text]);
                                return d.color;
                            }
                        })
                        .classed('compute',d=>!d.children)
                        .attr("pointer-events", d => !d.children ? "none" : null)
                        .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
                        .on("mouseout", function() { d3.select(this).attr("stroke", null); })
                        .on("click", d => focus !== d && (zoom(d), d3.event.stopPropagation()));
                }

                function updateNodes(istransition){
                    node=svg.select('g.circleG')
                        .selectAll("circle")
                        .data(root.descendants().slice(1),d=>d.data.name)
                        .call(updateNode);
                    node.exit().remove();
                    node = node.enter().append("circle")
                        .call(updateNode).merge(node);

                    let topValue = root.leaves().slice().filter(d=>getMetric(d)!=null).sort((a,b)=>getMetric(a)-getMetric(b));
                    topValue = _.flatten([topValue.slice(0,5),topValue.slice(topValue.length-5,topValue.length)]);
                    value_text = gvalue.selectAll(".value_text")
                        .data(topValue)
                        .text(d=>d3.format('.0f')(getMetric(d)));
                    value_text.exit().remove();
                    value_text = value_text.enter().append("text")
                        .attr('class','value_text')
                        .text(d=>d3.format('.0f')(getMetric(d))).merge(value_text)
                        .call(textcolor);
                    label = svg.select("g.label")
                        .selectAll("text")
                        .data(root.descendants());
                    label.exit().remove()
                    label = label.enter().append('text')
                        .style('font-size',d => d.parent === root ? 18 : 12)
                        .style("fill-opacity", d => d.parent === root ? 1 : 0)
                        .style("display", d => d.parent === root ? "inline" : "none")
                        .text(d => d.data.name).merge(label);
                    label.call(textcolor);
                    zoomTo(currentZoomData,istransition)
                }
                scope.onUserSelected = function (user){
                    svg.select('g.circleG').classed('fade',true);
                    node.filter(d=>d.children || ((!d.children)&& user.computes.find(c=>c===d.data.name))).classed('highlight',true)
                };
                scope.onUserDeselected = function (user){
                    svg.select('g.circleG').classed('fade',false);
                    node.classed('highlight',false)
                }
                function getMetric(a){
                        return a.data.metrics[serviceFullList[scope.serviceSelected].text];
                }
                function textcolor(p){
                        return p.style('fill',d=>{
                        if(d.children)
                            return '#ffffff';
                        else
                            return invertColor(d.color,true);
                    }).style('text-shadow',function(d){
                        if(d.children)
                            return '#000000'+' 1px 1px 0px';
                        else
                            return invertColor(invertColor(d.color,true),true)+' 1px 1px 0px';
                    })
                }
                function invertColor(hex, bw) {
                    const color = d3.color(hex)
                    var r = color.r,
                        g = color.g,
                        b = color.b;
                    if (bw) {
                        // http://stackoverflow.com/a/3943023/112731
                        return (r * 0.299 + g * 0.587 + b * 0.114) > 186
                            ? '#000000'
                            : '#FFFFFF';
                    }
                    // invert color components
                    color.r = (255 - r);
                    color.g = (255 - g);
                    color.b = (255 - b);
                    // pad each with zeros and return
                    return color.toString();
                }
                var datasetWatcher = scope.$watch(function() {
                    return serviceFullList;
                }, function() {
                    scope.service.serviceText = serviceFullList.map(d=>d.text);
                });
                function sortDataby(service){
                    data.children.forEach(r=>{
                        r.children.sort((a,b)=>{
                            return b.metrics[service]-a.metrics[service];
                        })
                    })

                }
                scope.serviceWatcher = function() {
                    scope.serviceSelected = this.serviceSelected;
                    this.colorItem.domain(serviceFullList[this.serviceSelected].range.slice().reverse());
                    sortDataby(serviceFullList[this.serviceSelected].text);
                    root = pack(data);
                    updateNodes(true);
                };

                scope.$on('$destroy', function() {
                    // Clean up watchers
                    datasetWatcher();
                });
                //
                // scope.watch(function(scope){return scope.nodeColor})
                // Initialize scope variables
                // scope.dataset = {
                //     name: '',
                //     data: '',
                //     sampletext:'',
                //     column:0,
                //     row:0,
                // };
                //
                //
                // scope.addDataset = function() {
                //     var data = d3.csvParse(scope.dataset.data);
                //
                //     var pastedDataset = {
                //         id: Date.now(),  // time as id
                //         name: scope.dataset.name,
                //         values: data,
                //         group: 'pasted'
                //     };
                //
                //     // Log that we have pasted data
                //
                //
                //     // Register the pasted data as a new dataset
                //     Dataset.dataset = Dataset.add(pastedDataset);
                //
                //     // Activate the newly-registered dataset
                //     Dataset.update(Dataset.dataset);
                //
                //     // Close this directive's containing modal
                //     closeModal();
                // };
            }
        };
    });
