/* June-2018
 * Tommy Dang (on the HPCC project, as Assistant professor, iDVL@TTU)
 *
 * THIS SOFTWARE IS BEING PROVIDED "AS IS", WITHOUT ANY EXPRESS OR IMPLIED
 * WARRANTY.  IN PARTICULAR, THE AUTHORS MAKE NO REPRESENTATION OR WARRANTY OF ANY KIND CONCERNING THE MERCHANTABILITY
 * OF THIS SOFTWARE OR ITS FITNESS FOR ANY PARTICULAR PURPOSE.
 */

var w = width*0.4,
    h = 200;

var svgStream = d3.select('.streamHolder').append('svg')
    .attr("class", "contextView")
    .attr("width", w)
    .attr("height", h);

// Simulation
var interval1;
var startTime;
var previousMiliseconds;
var currentMiliseconds;

var globalUserListString = "__";   // to keep the list of user active in the 10 minutes interval


function buildStreamGraph() {
    // HPCC ****************************************
    var minTime = new Date();
    var maxTime= new Date("1/1/2000");
    for (var i=0; i<hosts.length;i++) {
        for (var j = 0; j < hosts[i].jobList.length; j++) {
            var e =  hosts[i].jobList[j];
            if (new Date(e.startTime) <minTime)
                minTime = new Date(e.startTime);
            if (new Date(e.startTime) > maxTime)
                maxTime = new Date(e.startTime);
        }
    }
    startTime =  new Date((minTime.getMonth()+1)+"/"+minTime.getDate()+"/"+minTime.getFullYear()+" "+minTime.getHours()+":00:00");
    currentMiliseconds = startTime.getTime();  // For simulation
    previousMiliseconds = currentMiliseconds
    var numberOfhours = (maxTime-minTime)/3600000;
    var list = [];
    for (var hour=0; hour<numberOfhours;hour++) {
        var obj = {};
        obj.month = new Date(startTime.getTime()+hour*3600000);
        for (var u=0; u<users.length;u++) {
            obj[users[u].name] =0.3;
        }
        list.push(obj);
    }
    //Compute the hourly distributions
    for (var i=0; i<hosts.length;i++) {
        for (var j = 0; j < hosts[i].jobList.length; j++) {
            var t =  new Date(hosts[i].jobList[j].startTime);
            var index = Math.floor((t - startTime)/3600000);
            var u=  hosts[i].jobList[j].user;
            list[index][u]++;
        }
    }
    //Compute the hourly distributions
    for (var index=0; index<list.length;index++) {
        for (var u = 0; u < users.length; u++) {
            var name = users[u].name;
            list[index][name] = Math.pow(list[index][name],0.75);
        }
    }
    //debugger;

    var usernames = users.map(d => d.name)

    var stack = d3.stack()
        .keys(usernames)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetSilhouette);

    var series = stack(list);


    var x = d3.scaleTime()
        .domain(d3.extent(list, function(d){ return d.month; }))
        .range([30, w-40]);

    var xAxis = d3.axisBottom(x);

    var y = d3.scaleLinear()
        .domain([0, d3.max(series, function(layer) { return d3.max(layer, function(d){ return d[0] + d[1];}); })])
        .range([h/2, -h*0.98]);

    var area = d3.area()
        .x(function(d) {  return x(d.data.month); })
        .y0(function(d) { return y(d[0]); })
        .y1(function(d) { return y(d[1]); })
        .curve(d3.curveBasis);

    svgStream.selectAll(".areaUser")
        .data(series)
        .enter().append("path")
        .attr("class", "areaUser")
        .attr("d", area)
        .style("fill", function(d) {
            d.name = d.key;  // Create a new 'name' to be consistent with other data on mouse over
            return getColor(d.key); })
        .style("stroke", "#fff")
        .style("stroke-width", 0.1)
        .on('mouseover', function(d){
            d.name = d.key;  // Create a new 'name' to be consistent with other data on mouse over
            svgStream.selectAll(".areaUser")
                .style("fill-opacity", 0.1);
            d3.select(this).style("fill-opacity", 1);
            showHost(d);

            svg.selectAll(".nodeImages")
                .attr("opacity", function(d2){
                    return (d.name==d2.name) ? 1 :0.1;});
            node.attr("fill-opacity", function(d2){
                return (d.name==d2.name) ? 1 :0.1;});

        })
        .on('mouseout', function(d){
            svgStream.selectAll(".areaUser")
                .style("fill-opacity", 1);

            svg.selectAll(".nodeImages")
                .attr("opacity", 1);
            node.attr("fill-opacity", 1);
            hideHost(d);
        })

    svgStream.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + h/2 + ")")
        .call(xAxis);


    // Simulation
    var toggle =true;  // toggle variable for simulation

    interval1 = setInterval(function(){
        if (simulation.alpha()<0.05)  {
            previousMiliseconds = currentMiliseconds
            currentMiliseconds += 10*60000;  //every 10 minutes
            var currentDate = new Date(currentMiliseconds);

            // Update hosts in the racks
            //svg.selectAll(".nodeLine").remove();

            var userReverseList = {};
            for (var i=0; i<users.length;i++) {
                userReverseList[users[i].name] = users[i];
            }

            var foundSomeJob = false;
            var userListString = "__";   // to keep the list of user active in the 10 minutes interval
            for (var i=0; i<hosts.length;i++) {
                for (var j = 0; j < hosts[i].jobList.length; j++) {
                    var t =  new Date(hosts[i].jobList[j].startTime);
                    if (previousMiliseconds<t && t < currentDate){//} && hosts[i].jobList[j].masterQueue=="MASTER") {
                        svg.selectAll(".hpcc_node_" + hosts[i].hpcc_rack + "_" + hosts[i].hpcc_node+ "_"+j)
                            .attr("fill-opacity", 1);
                        svg.selectAll(".hpcc_node_" + hosts[i].hpcc_rack + "_" + hosts[i].hpcc_node+ "_"+j)
                            .transition().duration(1000)
                            .attr("fill-opacity", 0.5);

                        var user = userReverseList[hosts[i].jobList[j].user];
                        //if (j%2==0) {
                           /* if (user.name == "hge"){
                                svg.append("line")
                                    .attr("class", "nodeLine1" + toggle)
                                    .attr("x1", hosts[i].jobList[j].x + node_size / 2)
                                    .attr("y1", hosts[i].y + node_size-1)
                                    .attr("x2", user.x)
                                    .attr("y2", user.y)
                                    .attr("stroke", "#000")
                                    .attr("stroke-opacity", 0.8)
                                    .attr("stroke-width", 0.5);
                            }
                            else*/
                                svg.append("line")
                                    .attr("class", "nodeLine" + toggle)
                                    .attr("x1", hosts[i].jobList[j].x + node_size / 2)
                                    .attr("y1", hosts[i].y + node_size-1)
                                    .attr("x2", user.x)
                                    .attr("y2", user.y)
                                    .attr("stroke", "#000")
                                    .attr("stroke-opacity", 0.8)
                                    .attr("stroke-width", 0.5);


                       // }
                        foundSomeJob = true;
                        if (userListString.indexOf(hosts[i].jobList[j].user)<0){
                            userListString+=hosts[i].jobList[j].user+"__";
                        }
                    }
                }
            }

            svg.selectAll(".nodeLine"+(toggle))
                .transition().duration(300)
                .attr("stroke-opacity", 0.8);
            if (foundSomeJob==true){
                toggle = !toggle;
                // Update acitve users
                node.attr("fill-opacity", function(d){ return userListString.indexOf(d.name)>=0 ? 1 :
                    (globalUserListString.indexOf(d.name)>=0 ? 0.2 :0.1);});
                svg.selectAll(".nodeImages")
                    .attr("opacity",function(d){ return userListString.indexOf(d.name)>=0 ? 1 :
                        (globalUserListString.indexOf(d.name)>=0 ? 0.2 :0.1);});

                if (globalUserListString.indexOf(userListString)<0)
                    globalUserListString +=userListString;

                svg.selectAll(".nodeLine"+toggle).remove();
            }




            // Update the stream blind
            svgStream.selectAll(".streamBlind")
                .attr("x", x(currentDate));
            svgStream.selectAll(".currentTimeText")
                .attr("x", x(currentDate));
            svgStream.selectAll(".currentTimeText2")
                .attr("x", x(currentDate))
                .text(currentDate.toDateString());
            svgStream.selectAll(".currentTimeText3")
                .attr("x", x(currentDate))
                .text(currentDate.getHours()+":"+currentDate.getMinutes());


            if (currentDate> maxTime){
                clearInterval(interval1);

               // svg.selectAll(".nodeLine"+(!toggle)).remove();

                node.attr("fill-opacity",1);
                svg.selectAll(".nodeImages")
                    .attr("opacity",1);


                console.log("*************Done simulation");
            }
        }
    } , 1)

    svgStream.append("rect")
        .attr("class", "streamBlind")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", w)
        .attr("height", h)
        .attr("fill", "#ccc")
        .attr("fill-opacity", 0.8)
        .attr("stroke-width", 0);
    svgStream.append("text")
        .attr("class", "currentTimeText")
        .attr("x", 0)
        .attr("y", h-35)
        .attr("fill", "#000")
        .style("text-anchor","left")
        .style("font-size",11)
        //.style("font-weight","bold")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text("Current time");
    svgStream.append("text")
        .attr("class", "currentTimeText2")
        .attr("x", 0)
        .attr("y", h-20)
        .attr("fill", "#000")
        .style("text-anchor","left")
        .style("font-size",12)
        //.style("font-weight","bold")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text("");
    svgStream.append("text")
        .attr("class", "currentTimeText3")
        .attr("x", 0)
        .attr("y", h-5)
        .attr("fill", "#000")
        .style("text-anchor","left")
        .style("font-size",12)
        .style("font-weight","bold")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text("");
    svgStream.append("text")
        .attr("class", "startTimeText")
        .attr("x", 15)
        .attr("y", 20)
        .attr("fill", "#000")
        .style("text-anchor","left")
        .style("font-size",14)
        //.style("font-weight","bold")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255")
        .attr("font-family", "sans-serif")
        .text("Job startTime by users");


   ;
}
   