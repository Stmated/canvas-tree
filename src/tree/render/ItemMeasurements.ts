import {IPoint, VirtualLine, VirtualRectangle} from "../core/AbstractComponent";
import {IRenderSettings} from "../core/IRenderSettings";

export class ItemMeasurements {

    settings?: IRenderSettings;
    readonly item: VirtualRectangle;
    readonly icon: VirtualRectangle;
    readonly expand: VirtualRectangle;
    readonly box: VirtualRectangle;
    readonly text: VirtualRectangle;
    readonly focus: VirtualRectangle;

    readonly horizontalLine: VirtualLine;
    readonly verticalLine: VirtualLine;

    constructor(item: VirtualRectangle, icon: VirtualRectangle, expand: VirtualRectangle, box: VirtualRectangle, text: VirtualRectangle, focus: VirtualRectangle, horizontalLine: VirtualLine, verticalLine: VirtualLine) {
        this.item = item;
        this.icon = icon;
        this.expand = expand;
        this.box = box;
        this.text = text;
        this.focus = focus;
        this.horizontalLine = horizontalLine;
        this.verticalLine = verticalLine;
    }

    /**
     * Checks if the item contains the given virtual point.
     * The virtual point is the physical point incremented by the viewport.
     * So the viewport must have been applied to the point before being sent here.
     *
     * @param virtualPoint The virtual coordinate that we are checking for a hit match on.
     * @returns {string} The name of the area that was hit
     */
    getHit(virtualPoint: IPoint): string | null {

        if (this.item && this.item.isMatch(virtualPoint) == false) {

            // If the item does not match, then nothing matched.
            // Since the "item" is the surrounding rectangle for the whole thing.
            return null;
        }

        if (this.box && this.box.isMatch(virtualPoint)) return "box";
        if (this.expand && this.expand.isMatch(virtualPoint)) return "expand";
        if (this.text && this.text.isMatch(virtualPoint)) return "text";
        if (this.icon && this.icon.isMatch(virtualPoint)) return "icon";
        if (this.focus && this.focus.isMatch(virtualPoint)) return "focus";

        // We got no specific hit, so let's just return "item"
        return "item";
    }
}