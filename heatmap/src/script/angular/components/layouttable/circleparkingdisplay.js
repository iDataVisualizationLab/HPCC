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
                scope.service.selectedService = 0;
                scope.Layout = Layout;
                scope.width = 1000;
                scope.height = 800;
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

                    const root = pack(data);
                    let focus = root;
                    let view;

                    const svg = d3.select(".circlepacking-svg-content")
                        .on("click", () => zoom(root));

                    let node;
                    svg.append('g').attr('class','circleG');

                    const label = svg.append("g")
                        .attr('class','label')
                        .style("font", "10px sans-serif")
                        .attr("pointer-events", "none")
                        .attr("text-anchor", "middle")
                        .selectAll("text")
                        .data(root.descendants())
                        .enter().append("text")
                        .style("fill-opacity", d => d.parent === root ? 1 : 0)
                        .style("display", d => d.parent === root ? "inline" : "none")
                        .text(d => d.data.name);
                    let value_text;
                    const gvalue = svg.append("g").attr('class','value')
                        .style("font", "10px sans-serif")
                        .attr("pointer-events", "none")
                        .attr("text-anchor", "middle");
                let currentZoomData  = [root.x, root.y, root.r * 2];
                    updateNodes();

                    function zoomTo(v) {
                        const k = width / v[2];

                        view = v;

                        label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
                        value_text.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
                        node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
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
                                            serviceFullList.forEach(s=>item.metrics[s.text]=_.last(Dataset.data[d][serviceListattr[s.idroot]])[s.id]);
                                            return item;
                                        })
                                }))
                        }
                    }
                    function updateNode(node){
                        return node
                            .attr("fill", d => {
                                if(d.children)
                                    return color(d.depth)
                                else
                                    return colorItem(d.data.metrics[serviceFullList[scope.serviceSelected].text])
                            })
                            .attr("pointer-events", d => !d.children ? "none" : null)
                            .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
                            .on("mouseout", function() { d3.select(this).attr("stroke", null); })
                            .on("click", d => focus !== d && (zoom(d), d3.event.stopPropagation()));
                    }

                function updateNodes(){
                    node=svg.select('g.circleG')
                        .selectAll("circle")
                        .data(root.descendants().slice(1))
                        .call(updateNode);
                    node.exit().remove();
                    node = node.enter().append("circle")
                        .call(updateNode).merge(node);

                    let topValue = root.leaves().slice().sort((a,b)=>getMetric(a)-getMetric(b));
                    topValue = _.flatten([topValue.slice(0,5),topValue.slice(topValue.length-5,topValue.length)]);
                    value_text = gvalue.selectAll(".value_text")
                        .data(topValue)
                        .text(d=>d3.format('.1f')(getMetric(d)));
                    value_text.exit().remove();
                    value_text = value_text.enter().append("text")
                        .attr('class','value_text')
                        .text(d=>d3.format('.1f')(getMetric(d))).merge(value_text);
                    zoomTo(currentZoomData)
                }
                function getMetric(a){
                        return a.data.metrics[serviceFullList[scope.serviceSelected].text];
                }
                var datasetWatcher = scope.$watch(function() {
                    return serviceFullList;
                }, function() {
                    scope.service.serviceText = serviceFullList.map(d=>d.text);
                });

                scope.serviceWatcher = function() {
                    scope.serviceSelected = this.serviceSelected;
                    this.colorItem.domain(serviceFullList[this.serviceSelected].range.slice().reverse());
                    updateNodes();
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
