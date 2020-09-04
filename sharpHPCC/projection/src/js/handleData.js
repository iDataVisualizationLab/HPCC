
let currentDraw=()=>{};
let tsnedata = {};
function queryData({solution,feature}) {
    currentDraw = _.partial(draw,{solution,feature});
    currentDraw(serviceSelected);
}
