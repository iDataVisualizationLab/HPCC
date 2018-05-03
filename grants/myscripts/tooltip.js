// Setup the tool tip.  Note that this is just one example, and that many styling options are available.
    // See original documentation for more details on styling: http://labratrevenge.com/d3-tip/
    var tool_tip = d3.tip()
      .attr("class", "d3-tip")
      .offset([-8, 200])
      .html(function(d) { 
        str="";
        str+="<table border='0.5px'  style='width:100%'>"
        for (key in d) {
          if (key== "x" || key== "y" || key== "vx" || key== "vy" || key== "fx" || key== "fy" || key== "index"|| key== "SponsorList"|| key== "originalOrder"|| key== "valueList")
              ;// Do nothing
          else if (key== "Amount")
            str+=  "<tr><td> Amount</td> <td>  <span style='color:black'>" + d[key].toLocaleString() + "</span> </td></tr>";
          else if (key== "Deadline")
            str+=  "<tr><td> Deadline</td> <td>  <span style='color:black'>" + formatDate(d[key]) + "</span> </td></tr>";
          else if (key== "name")
            str+=  "<tr><td> Title</td> <td>  <span style='color:black'>" + d[key] + "</span> </td></tr>";
          else if (key== "Link")
            str+=  "<tr><td>"+key+"</td> <td>  <span style='color:blue'>" + d[key] + "</span> </td></tr>";
          else{
            str+=  "<tr><td>"+key+"</td> <td>  <span style='color:black'>" + d[key] + "</span> </td></tr>";
          }     
        } 
        str+="</table> <br>"
        if (d.Link!=undefined)
          str+="<span style='color:blue'><b> Please CLICK to go to the page </b></span> "
        return str; });
    svg.call(tool_tip);


var tool_tip2 = d3.tip()
    .attr("class", "d3-tip")
    .offset([-20, 0])
    .html(function(d) {
        str="";
        str+="<table border='0.5px'  style='width:100%'>"
        for (key in d) {
            if (key== "x" || key== "y" || key== "vx" || key== "vy" || key== "fx" || key== "fy" || key== "index"|| key== "SponsorList"|| key== "originalOrder"|| key== "valueList")
                ;// Do nothing
            else if (key== "Amount")
                str+=  "<tr><td> Total</td> <td>  <span style='color:black'>" + d[key].toLocaleString() + "</span> </td></tr>";
            else if (key== "Deadline")
                str+=  "<tr><td> Deadline</td> <td>  <span style='color:black'>" + formatDate(d[key]) + "</span> </td></tr>";
            else if (key== "name")
                str+=  "<tr><td> Sponsor</td> <td>  <span style='color:black'>" + d[key] + "</span> </td></tr>";
            else if (key== "Link")
                str+=  "<tr><td>"+key+"</td> <td>  <span style='color:blue'>" + d[key] + "</span> </td></tr>";
            else{
                str+=  "<tr><td>"+key+"</td> <td>  <span style='color:black'>" + d[key] + "</span> </td></tr>";
            }
        }
        str+="</table> <br>"
        if (d.Link!=undefined)
            str+="<span style='color:blue'><b> Please CLICK to go to the page </b></span> "
        return str; });
svg2.call(tool_tip2);
    
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