// Setup the tool tip.  Note that this is just one example, and that many styling options are available.
    // See original documentation for more details on styling: http://labratrevenge.com/d3-tip/

var tool_tip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-20, 0])
    .html(function(d) {
        str="";
        str+="<table border='0.5px'  style='width:100%'>"
        for (key in d) {
            if (key== "x" || key== "y" || key== "vx" || key== "vy" || key== "fx" || key== "fy")
                ;// Do nothing
            else if (key== "nodes")
                str+=  "<tr><td> Number of nodes</td> <td>  <span style='color:black'>" + d[key].length + "</span> </td></tr>";
            else if (key== "Link")
                str+=  "<tr><td>"+key+"</td> <td>  <span style='color:blue'>" + d[key] + "</span> </td></tr>";
            else{
                str+=  "<tr><td>"+key+"</td> <td>  <span style='color:black'>" + d[key] + "</span> </td></tr>";
            }
        }
        str+="</table> <br>"

        return str; });
svg.call(tool_tip);
    
function formatDate(date) {
  var monthNames = [
    "January", "February", "March",
    "April", "May", "June", "July",
    "August", "September", "October",
    "November", "December"
  ];

  var day = date.getDate();
  var monthIndex = date.getMonth();
  var year = date.getFullYear();

  return day + ' ' + monthNames[monthIndex] + ' ' + year;
}