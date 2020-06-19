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
            controller: function ($scope) {

            },
            link: function postLink(scope, element, attrs, modalController) {
                // If this directive occurs within a a modal, give ourselves a way to close
                // that modal once the add button has been clicked
                function closeModal() {
                    if (modalController) {
                        modalController.close();
                    }
                }
                scope.Layout = Layout;
                scope.width = 1000;
                scope.height = 800;
                const width = scope.width;
                const height = scope.height;

                const color = d3.scaleLinear()
                    .domain([0, 5])
                    .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
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

                const node = svg.append("g")
                    .selectAll("circle")
                    .data(root.descendants().slice(1))
                    .enter().append("circle")
                    .attr("fill", d => d.children ? color(d.depth) : "white")
                    .attr("pointer-events", d => !d.children ? "none" : null)
                    .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
                    .on("mouseout", function() { d3.select(this).attr("stroke", null); })
                    .on("click", d => focus !== d && (zoom(d), d3.event.stopPropagation()));

                const label = svg.append("g")
                    .style("font", "10px sans-serif")
                    .attr("pointer-events", "none")
                    .attr("text-anchor", "middle")
                    .selectAll("text")
                    .data(root.descendants())
                    .enter().append("text")
                    .style("fill-opacity", d => d.parent === root ? 1 : 0)
                    .style("display", d => d.parent === root ? "inline" : "none")
                    .text(d => d.data.name);

                zoomTo([root.x, root.y, root.r * 2]);

                function zoomTo(v) {
                    const k = width / v[2];

                    view = v;

                    label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
                    node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
                    node.attr("r", d => d.r * k);
                }

                function zoom(d) {
                    const focus0 = focus;

                    focus = d;

                    const transition = svg.transition()
                        .duration(d3.event.altKey ? 7500 : 750)
                        .tween("zoom", d => {
                            const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
                            return t => zoomTo(i(t));
                        });

                    label
                        .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
                        .transition(transition)
                        .style("fill-opacity", d => d.parent === focus ? 1 : 0)
                        .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
                        .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
                }

                function data2tree(data){
                    return {name:"__main__",children:data.map(d=>(
                                {
                                    name:d.Name,
                                    children:_.flatten(d.value)
                                        .filter(d=>d!==null)
                                        .map(d=>({
                                            name:d,
                                            value:1
                                        }))
                                }))
                            }
                }
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
