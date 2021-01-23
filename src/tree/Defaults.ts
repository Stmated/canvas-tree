import {IRenderSettings} from "./core/IRenderSettings";
import {Theme} from "./render/Theme";

const DEFAULT_TREE_THEME: Theme = {

    backgroundFillColor: "white",
    font: "Segoe UI",
    dndSourceBackgroundColor: "rgba(150, 150, 255, 0.25)",
    dndTargetAllowedBackgroundColor: "rgba(100, 100, 255, 1)",
    dndTargetDisallowedBackgroundColor: "rgba(255, 100, 100, 1)",
    itemLineColor: "rgb(100, 100, 100)",
    itemLineDash: [1, 2],

    itemBoxStrokeColor: "rgb(145, 145, 145)",
    itemBoxGradientColor1: "rgb(252, 252, 252)",
    itemBoxGradientColor2: "rgb(227, 227, 227)",

    plusStrokeColor: "rgb(41, 66, 114)",
    minusStrokeColor: "rgb(75, 99, 167)",

    focusStrokeColor: "rgb(0, 0, 0)",
    focusFillColor: "rgb(51, 153, 255)",

    dndSelectedDisallowedFillColor: "rgb(255, 100, 100)",

    textSelected: "white",
    text: "black",

    scrollbarFillColor: "rgb(51, 153, 255)",
    scrollbarStrokeColor: "rgb(0, 0, 0)"
};

const DEFAULT_RENDER_SETTINGS: IRenderSettings = {

    canvasPaddingTop: 8,
    canvasPaddingLeft: 8,

    boxWidth: 8,
    boxHeight: 8,
    iconWidth: 16,
    iconHeight: 16,
    iconPaddingRight: 3,
    itemHeight: 18,
    itemMarginBottom: 0,
    itemPaddingLeft: 3,
    itemPaddingTop: 1,
    depthMarginLeft: 20,
    fontHeight: 9,
};

export default class Defaults {

    public static getDefaultTheme(): Theme {
        return DEFAULT_TREE_THEME;
    }

    public static getDefaultRenderSettings(): IRenderSettings {
        return DEFAULT_RENDER_SETTINGS;
    }
}