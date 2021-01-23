export interface Theme {

    backgroundFillColor: string;
    font: string;
    dndSourceBackgroundColor: string;
    dndTargetAllowedBackgroundColor: string;
    dndTargetDisallowedBackgroundColor: string;
    itemLineColor: string;
    itemLineDash: number[];

    itemBoxStrokeColor: string;
    itemBoxGradientColor1: string;
    itemBoxGradientColor2: string;

    plusStrokeColor: string;
    minusStrokeColor: string;

    focusStrokeColor: string;
    focusFillColor: string;

    dndSelectedDisallowedFillColor: string;

    text: string;
    textSelected: string;

    scrollbarFillColor: string;
    scrollbarStrokeColor: string;
}