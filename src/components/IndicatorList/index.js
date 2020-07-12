// 对indicator-list的暴露

import IndicatorList from "./IndicatorList";
import Indicator from "./Indicator"; 

IndicatorList.install = function(app, options){
    if (IndicatorList.installed)
        return;

    app.component("indicator", Indicator);
    app.component("indicator-list", IndicatorList);

    IndicatorList.installed = true;
}

export default IndicatorList;