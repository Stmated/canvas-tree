import {
    ICallback, ICallback2, IImageProvider, IPoint, VirtualLine,
    VirtualRectangle
} from "../core/AbstractComponent";
import {IRenderEntry} from "../core/IRenderEntry";
import {RenderPass} from "./RenderPass";
import {ITreeRenderer} from "./ITreeRenderer";
import {Theme} from "./Theme";
import {ThemeProvider} from "./ThemeProvider";
import {ItemMeasurements} from "./ItemMeasurements";
import {IRenderSettings} from "../core/IRenderSettings";
import {IIconLoadedCallback} from "./IIconLoadedCallback";
import {Placement} from "./Placement";
import Defaults from "../Defaults";

interface IconMap {
    [s: string]: HTMLImageElement;
}

interface IconCallbackMap {
    [s: string]: IIconLoadedCallback[]
}

export class AbstractTreeRenderer<TNode> implements ITreeRenderer<TNode> {

    private _invalidateListeners: ICallback[] = [];
    private _renderCount: number = 0;
    private _previousTotalHeight: number = -1;
    private _imageProviders: IImageProvider[] = [];
    private _icons: IconMap = {};
    private _queuedIconRequests: IconCallbackMap = {};
    private _sizeMultiplier: number = 1;
    private _themeProvider: ThemeProvider | undefined;

    setSizeMultiplier(value: number) {
        this._sizeMultiplier = value;
    }

    public getText(node: TNode, callback: { (data: string): void }) {
        throw new Error('This method is abstract. Inherit the AbstractTreeRenderer');
    }

    public getIconKey(node: TNode, callback: { (data: string): void }) {
        throw new Error('This method is abstract. Inherit the AbstractTreeRenderer');
    }

    public addInvalidationListener(listener: ICallback) {
        this._invalidateListeners.push(listener);
    }

    public setThemeProvider(value: ThemeProvider) {
        this._themeProvider = value;
    }

    public getThemeProvider(): ThemeProvider {

        if (!this._themeProvider) {
            this._themeProvider = {
                getTheme(): Theme {
                    return Defaults.getDefaultTheme();
                }
            };
        }

        return this._themeProvider;
    }

    protected fireInvalidationListeners() {
        for (let i = 0; i < this._invalidateListeners.length; i++) {
            this._invalidateListeners[i]();
        }
    }

    protected loadIcon(node: TNode, callback: IIconLoadedCallback) {

        this.getIconKey(node, (iconKey) => {

            if (this._icons[iconKey]) {

                // This image already exists in the cache, so let's return that one.
                callback(null, this._icons[iconKey]);
                return;
            }

            if (this._queuedIconRequests[iconKey]) {

                // This image is currently loading, so we'll append our callback.
                this._queuedIconRequests[iconKey].push(callback);
                return;
            }

            let renderer = this;
            this._queuedIconRequests[iconKey] = [callback];
            for (let i = 0; i < this._imageProviders.length; i++) {

                this._imageProviders[i].getImage({
                    key: iconKey,
                    callback: (provider: IImageProvider, imageBase64: string) => {

                        let img = new Image();

                        if (imageBase64.startsWith('data:')) {
                            img.src = imageBase64;
                        } else {
                            img.src = 'data:image/png;base64,' + imageBase64;
                        }

                        img.onload = function () {

                            renderer._icons[iconKey] = img;

                            // Now let's send back the icon to all the queued listeners of this icon key.
                            for (let n = 0; n < renderer._queuedIconRequests[iconKey].length; n++) {
                                renderer._queuedIconRequests[iconKey][n](provider, img);
                            }

                            delete renderer._queuedIconRequests[iconKey];
                        };
                    }
                });
            }
        });
    }

    public addImageProvider(provider: IImageProvider) {
        this._imageProviders.push(provider);
    }

    public getImageProviders(): IImageProvider[] {
        return this._imageProviders;
    }

    getRenderCount(): number {
        return this._renderCount;
    }

    renderBackground(pass: RenderPass<TNode>) {

        const ctx = pass.getContext();

        // We'll count the clearing/rendering of the background as the start of a new rendering pass.
        this._renderCount++;
        ctx.fillStyle = pass.getTheme().backgroundFillColor;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    renderBorder(pass: RenderPass<TNode>) {

        const ctx = pass.getContext();

        //ctx.strokeStyle = "rgb(100, 100, 100)";
        //ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    getEntryDepth(entry: IRenderEntry<TNode>): number {

        let entryStackSize = 0;
        let entryPointer: IRenderEntry<TNode> | null = entry;
        while (entryPointer) {
            entryStackSize++;
            entryPointer = entryPointer.parent;
        }

        return entryStackSize;
    }

    private readonly _cachedMeasurements: {[key: string]: TextMetrics} = {};

    getMeasurement(pass: RenderPass<TNode>, entry: IRenderEntry<TNode>, callback: ICallback2<ItemMeasurements, string>): void {

        const ctx = pass.getContext();
        const rs = pass.getTree().getTreeRenderSettings();
        const node = entry.node;

        const item = new VirtualRectangle({
            x: rs.itemPaddingLeft,
            y: rs.canvasPaddingTop + rs.itemPaddingTop + (entry.line * rs.itemHeight) + (entry.line * rs.itemMarginBottom),
            width: ctx.canvas.width,
            height: rs.itemHeight
        });

        const icon = new VirtualRectangle({
            x: rs.canvasPaddingLeft + item.getLeft() + ((this.getEntryDepth(entry) - 1) * rs.depthMarginLeft),
            y: item.getCenterY() - (rs.iconHeight / 2),
            width: rs.iconWidth,
            height: rs.iconHeight
        });

        const horizontalLine = new VirtualLine(
            {
                x: icon.getLeft() - rs.depthMarginLeft + (rs.iconWidth / 2),
                y: item.getTop() + (rs.itemHeight / 2)
            },
            {
                x: icon.getLeft(),
                y: item.getTop() + (rs.itemHeight / 2)
            }
        );

        // The vertical line will start at the set coordinates, but might be painted multiple times.
        // It will be painted once for each depth, ie. paint the vertical line of its parent node.
        const verticalLine = new VirtualLine(
            {
                x: horizontalLine.getLeft(),
                y: item.getTop() - rs.itemMarginBottom
            },
            {
                x: horizontalLine.getLeft(),
                y: item.getBottom()
            }
        );

        const expand = new VirtualRectangle({
            x: icon.getLeft() - rs.depthMarginLeft,
            y: icon.getTop(),
            width: rs.depthMarginLeft,
            height: rs.itemHeight
        });

        const box = new VirtualRectangle({
            x: icon.getCenterX() - rs.depthMarginLeft - (rs.boxWidth / 2),
            y: icon.getCenterY() - (rs.boxHeight / 2),
            width: rs.boxWidth,
            height: rs.boxHeight
        });

        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.font = rs.fontHeight + "pt " + pass.getTheme().font;

        this.getText(node, (text) => {

            const key = text + ctx.font + ctx.textBaseline;
            if (!this._cachedMeasurements[key]) {
                this._cachedMeasurements[key] = ctx.measureText(text);
            }

            const textMeasurement = this._cachedMeasurements[key];

            const textRect = new VirtualRectangle({
                x: icon.getRight() + rs.iconPaddingRight + 2, // + 2 for some padding from focus
                y: item.getTop() + 2,
                width: textMeasurement.width,
                height: rs.itemHeight - 3
            });

            const focus = new VirtualRectangle({
                x: icon.getRight() + rs.iconPaddingRight,
                y: textRect.getTop(),
                width: textMeasurement.width + 6, // + 6 for some leeway
                height: textRect.getHeight()
            });

            const measurements = new ItemMeasurements(item, icon, expand, box, textRect, focus, horizontalLine, verticalLine);
            callback(measurements, text);
        });
    }

    renderItem(pass: RenderPass<TNode>, entry: IRenderEntry<TNode>): void {

        const ctx = pass.getContext();
        const node = entry.node;
        this.getMeasurement(pass, entry, (measurements, itemText) => {

            // Save the sizes into the entry, and we'll send that around instead.
            entry.sizes = measurements;

            let dndIsSource: boolean = false;
            if (!pass.getHitTest() && !pass.getItemTest() && pass.getDndSourceNodes() && pass.getDndTargetPoint()) {

                // We're rendering.
                // Let's gather info about DnD, so the rendering can change depending on target/source
                let marginHalf = pass.getTree().getTreeRenderSettings().itemMarginBottom;
                marginHalf = marginHalf == 0 ? 0 : (marginHalf / 2);

                // One forth of the item's height should be for "above" and "below".
                // The rest of the center should be for "inside"
                const gutter = (pass.getTree().getTreeRenderSettings().itemHeight / 3.5);

                const top = measurements.item.getTop();
                const bottom = measurements.item.getBottom();

                dndIsSource = pass.getDndSourceNodes().indexOf(node) != -1;
                const dndTargetPoint = pass.getDndTargetPoint();
                let dndTargetPlacement = (dndTargetPoint) ? AbstractTreeRenderer.getPlacement(dndTargetPoint, top, bottom, marginHalf, gutter) : null;

                if (pass.getTree().getTreeState().isExpanded(node)) {
                    if (dndTargetPlacement == Placement.BELOW) {

                        // If the current node is expanded, then we do not allow "below" as a placement.
                        // Instead it should count as "inside", since that is most likely what the user wants.
                        dndTargetPlacement = Placement.INSIDE;
                    }
                }

                if (dndTargetPlacement != undefined) {

                    entry.dndPlacement = dndTargetPlacement;

                    // Set the target node to the pass, so we can know the target after rendering is done.
                    pass.setDndTargetNode(node, entry.dndPlacement);
                }
            }

            if (pass.isDndAllowed() && entry.dndPlacement !== undefined) {

                let target: TNode | undefined = undefined;
                if (entry.dndPlacement == Placement.INSIDE) {
                    target = pass.getDndTargetNode(); // same as pass.getCurrentEntry()
                } else {
                    const parentEntry = entry.parent;
                    target = parentEntry ? parentEntry.node : pass.getDndTargetNode();
                }

                // The possible DnD is still allowed.
                // Let's see if the source and target are still compatible.
                // TODO: This needs to be cached during the dragging. Too heavy to recalculate for every moved pixel.
                const targets: TNode[] = [];
                let entryPointer: IRenderEntry<TNode> | null = entry;
                while (entryPointer != null) {

                    targets.push(entryPointer.node);
                    if (entryPointer.node == target) {
                        break;
                    }

                    entryPointer = entryPointer.parent;
                }

                // TODO: Rendering of the DnD markers need to be done async when we arrive at the callback!
                let remaining: number = pass.getDndSourceNodes().length;
                let allowCount = 0;
                let disallowCount = 0;
                for (let source of pass.getDndSourceNodes()) {
                    pass.getTree().isDndTargetAllowed(source, targets, (result) => {

                        // All must be allowed for the operation to actually be truly allowed.
                        if (result != null) {
                            if (result) {
                                allowCount++;
                            } else {
                                disallowCount++;
                            }
                        }

                        remaining--;

                        if (remaining == 0) {

                            const allowed = (allowCount > 0 && disallowCount == 0);
                            pass.setDndAllowed(allowed);
                            this.renderDnd(pass, entry);
                        }
                    });
                }
            }

            if (pass.getHitTest()) {

                const virtualHitLocation = pass.getHitTest();
                if (virtualHitLocation) {
                    const result = measurements.getHit(virtualHitLocation);
                    if (result) {

                        pass.setHitTestResult({
                            node: node,
                            areaName: result,
                            measurement: measurements
                        });

                        pass.abort();
                        return;
                    }
                }

            } else if (pass.getItemTest()) {

                if (node == pass.getItemTest()) {

                    // If this is the item we were looking for,
                    // then we will return the measurements of the item.
                    pass.setItemTestResult(measurements);
                    pass.abort();
                    return;
                }

            } else {

                if (dndIsSource) {

                    const x = Math.round(measurements.item.getLeft(pass.getViewPort())) - 0.5;
                    const y = Math.round(measurements.item.getTop(pass.getViewPort())) - 0.5;
                    const w = Math.round(measurements.item.getWidth());
                    const h = Math.round(measurements.item.getHeight());

                    ctx.fillStyle = pass.getTheme().dndSourceBackgroundColor;
                    ctx.fillRect(x, y, w, h);
                }

                this.renderItemLine(pass, entry);
                this.renderItemIcon(pass, entry);

                const childCount = pass.getTree().getTreeModel().getChildCount(node);
                if (entry.parent && childCount !== 0) {

                    this.renderItemBox(pass, entry);

                    if (pass.getTree().getTreeState().isExpanded(node)) {
                        this.renderItemBoxMinus(pass, entry);
                    } else {
                        this.renderItemBoxPlus(pass, entry);
                    }
                }

                this.renderItemFocus(pass, entry);
                this.renderItemText(itemText, pass, entry);
            }
        });
    }

    public renderDnd(pass: RenderPass<TNode>, entry: IRenderEntry<TNode>): void {

        const ctx = pass.getContext(), sizes = entry.sizes;
        if (!sizes) {
            return;
        }

        if (pass.isDndAllowed()) {
            ctx.strokeStyle = pass.getTheme().dndTargetAllowedBackgroundColor;
        } else {
            ctx.strokeStyle = pass.getTheme().dndTargetDisallowedBackgroundColor;
        }

        const quarterHeight = sizes.item.getHeight() / 4;

        if (entry.dndPlacement == Placement.ABOVE) {

            ctx.beginPath();
            ctx.moveTo(
                Math.round(sizes.box.getLeft(pass.getViewPort())) - 4 - 0.5,
                Math.round(sizes.item.getTop(pass.getViewPort()) + quarterHeight) - 0.5);

            ctx.lineTo(
                Math.round(sizes.box.getLeft(pass.getViewPort())) - 4 - 0.5,
                Math.round(sizes.item.getTop(pass.getViewPort())) - 0.5);

            ctx.lineTo(
                Math.round(sizes.focus.getRight(pass.getViewPort())) + 2 - 0.5,
                Math.round(sizes.item.getTop(pass.getViewPort())) - 0.5);

            ctx.lineTo(
                Math.round(sizes.focus.getRight(pass.getViewPort())) + 2 - 0.5,
                Math.round(sizes.item.getTop(pass.getViewPort()) + quarterHeight) - 0.5);

            ctx.stroke();

        } else if (entry.dndPlacement == Placement.BELOW) {

            ctx.beginPath();
            ctx.moveTo(
                Math.round(sizes.box.getLeft(pass.getViewPort())) - 4 - 0.5,
                Math.round(sizes.item.getBottom(pass.getViewPort()) - quarterHeight) - 0.5);

            ctx.lineTo(
                Math.round(sizes.box.getLeft(pass.getViewPort())) - 4 - 0.5,
                Math.round(sizes.item.getBottom(pass.getViewPort())) - 0.5);

            ctx.lineTo(
                Math.round(sizes.focus.getRight(pass.getViewPort())) + 2 - 0.5,
                Math.round(sizes.item.getBottom(pass.getViewPort())) - 0.5);

            ctx.lineTo(
                Math.round(sizes.focus.getRight(pass.getViewPort())) + 2 - 0.5,
                Math.round(sizes.item.getBottom(pass.getViewPort()) - quarterHeight) - 0.5);

            ctx.stroke();
        }
    }

    private static getPlacement(point: IPoint, top: number, bottom: number, marginHalf: number, gutter: number): Placement | null {

        if (point.y <= (bottom + marginHalf)) {

            if (point.y >= bottom - gutter) {
                return Placement.BELOW;
            } else if (point.y >= top + gutter) {
                return Placement.INSIDE;
            }
        }

        if (point.y > (top - marginHalf)) {

            if (point.y < top + gutter) {
                return Placement.ABOVE;
            } else if (point.y <= bottom - gutter) {
                return Placement.INSIDE;
            }
        }

        return null;
    }

    renderItemLine(pass: RenderPass<TNode>, entry: IRenderEntry<TNode>) {

        const ctx = pass.getContext(), sizes = entry.sizes;
        if (!sizes) {
            return;
        }

        ctx.strokeStyle = pass.getTheme().itemLineColor;
        ctx.setLineDash(pass.getTheme().itemLineDash);

        let backSteps = 0;
        let entryPointer: IRenderEntry<TNode> | null = entry;
        while (entryPointer) {

            ctx.strokeStyle = pass.getTheme().itemLineColor;;

            const negativeOffsetSteps = (backSteps + 1);
            if (negativeOffsetSteps > 1) {

                // If we're rendering for an item higher up in the hierarchy,
                // and its item is the last child of its parent, then we should not render its lines.
                // const depthIndex = (entryStackSize - 1 - backSteps);
                if (entryPointer.isLast) {
                    entryPointer = entryPointer.parent;
                    backSteps++;
                    continue;
                }
            }

            const depthMarginLeft = pass.getTree().getTreeRenderSettings().depthMarginLeft;
            const currentX = Math.round(sizes.icon.getCenterX(pass.getViewPort()) - (negativeOffsetSteps * depthMarginLeft)) - 0.5;
            const vStop = (entry.isLast && negativeOffsetSteps == 1)
                ? sizes.item.getCenterY(pass.getViewPort())
                : sizes.verticalLine.getBottom(pass.getViewPort()); // renderOptions['line_v_stop_y'];

            ctx.beginPath();
            ctx.moveTo(currentX, Math.round(sizes.verticalLine.getTop(pass.getViewPort())) - 0.5);
            ctx.lineTo(currentX, Math.round(vStop) - 0.5);
            ctx.stroke();

            entryPointer = entryPointer.parent;
            backSteps++;
        }

        ctx.strokeStyle = pass.getTheme().itemLineColor;
        if (entry.parent) {

            ctx.beginPath();
            ctx.moveTo(
                Math.round(sizes.horizontalLine.getLeft(pass.getViewPort())) - 0.5,
                Math.round(sizes.horizontalLine.getTop(pass.getViewPort())) - 0.5);
            ctx.lineTo(
                Math.round(sizes.horizontalLine.getRight(pass.getViewPort())) - 0.5,
                Math.round(sizes.horizontalLine.getBottom(pass.getViewPort())) - 0.5);
            ctx.stroke();
        }

        ctx.setLineDash([]);
    }

    renderItemBox(pass: RenderPass<TNode>, entry: IRenderEntry<TNode>) {

        const ctx = pass.getContext(), sizes = entry.sizes;
        if (!sizes) {
            return;
        }

        //ctx.fillStyle = "rgb(255, 255, 255)";

        const gradient = ctx.createLinearGradient(
            Math.round(sizes.box.getLeft(pass.getViewPort())) - 0.5, Math.round(sizes.box.getTop(pass.getViewPort())) - 0.5,
            Math.round(sizes.box.getLeft(pass.getViewPort())) - 0.5, Math.round(sizes.box.getBottom(pass.getViewPort())) - 0.5
        );

        gradient.addColorStop(0, pass.getTheme().itemBoxGradientColor1);
        gradient.addColorStop(1, pass.getTheme().itemBoxGradientColor2);

        const x = Math.round(sizes.box.getLeft(pass.getViewPort())) - 0.5;
        const y = Math.round(sizes.box.getTop(pass.getViewPort())) - 0.5;
        const w = Math.round(sizes.box.getWidth());
        const h = Math.round(sizes.box.getHeight());

        ctx.fillStyle = gradient;
        ctx.strokeStyle = pass.getTheme().itemBoxStrokeColor;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
    }

    renderItemBoxPlus(pass: RenderPass<TNode>, entry: IRenderEntry<TNode>) {

        const ctx = pass.getContext(), sizes = entry.sizes;
        if (!sizes) {
            return;
        }

        ctx.strokeStyle = pass.getTheme().plusStrokeColor;
        ctx.beginPath();
        ctx.moveTo(Math.round(sizes.box.getCenterX(pass.getViewPort())) - 0.5, Math.round(sizes.box.getTop(pass.getViewPort()) + 2) - 0.5);
        ctx.lineTo(Math.round(sizes.box.getCenterX(pass.getViewPort())) - 0.5, Math.round(sizes.box.getBottom(pass.getViewPort()) - 2) - 0.5);
        ctx.stroke();

        // The horizontal part of the plus is the minus
        this.renderItemBoxMinus(pass, entry);
    }

    renderItemBoxMinus(pass: RenderPass<TNode>, entry: IRenderEntry<TNode>) {

        const ctx = pass.getContext(), sizes = entry.sizes;
        if (!sizes) {
            return;
        }

        ctx.strokeStyle = pass.getTheme().minusStrokeColor;
        ctx.beginPath();
        ctx.moveTo(Math.round(sizes.box.getLeft(pass.getViewPort()) + 2) - 0.5, Math.round(sizes.box.getCenterY(pass.getViewPort())) - 0.5);
        ctx.lineTo(Math.round(sizes.box.getRight(pass.getViewPort()) - 2) - 0.5, Math.round(sizes.box.getCenterY(pass.getViewPort())) - 0.5);
        ctx.stroke();
    }

    renderItemIcon(pass: RenderPass<TNode>, entry: IRenderEntry<TNode>) {

        const ctx = pass.getContext(), sizes = entry.sizes;
        if (!sizes) {
            return;
        }

        const renderer = pass.getTree().getTreeRenderer();
        const previousRenderCount = renderer.getRenderCount();
        this.loadIcon(entry.node, function (provider, imageIcon) {

            if (previousRenderCount == renderer.getRenderCount()) {

                // Only render the icon if we're still on the same rendering.
                // Otherwise we might render the icon twice, or on the wrong location.
                if (imageIcon) {
                    ctx.drawImage(imageIcon, sizes.icon.getLeft(pass.getViewPort()), sizes.icon.getTop(pass.getViewPort()), sizes.icon.getWidth(), sizes.icon.getHeight());
                }
            }
        });
    }

    renderItemFocus(pass: RenderPass<TNode>, entry: IRenderEntry<TNode>) {

        const ctx = pass.getContext(), sizes = entry.sizes;
        if (!sizes) {
            return;
        }

        const isSelected = pass.getTree().getTreeState().isSelected(entry.node);
        if (isSelected || entry.dndPlacement == Placement.INSIDE) {

            const x = Math.round(sizes.focus.getLeft(pass.getViewPort())) - 0.5;
            const y = Math.round(sizes.focus.getTop(pass.getViewPort())) - 0.5;
            const w = sizes.focus.getWidth();
            const h = sizes.focus.getHeight();

            if (entry.dndPlacement !== undefined && pass.isDndAllowed() == false) {
                ctx.fillStyle = pass.getTheme().dndSelectedDisallowedFillColor;
            } else {
                ctx.fillStyle = pass.getTheme().focusFillColor;
            }

            ctx.strokeStyle = pass.getTheme().focusStrokeColor;
            ctx.fillRect(x, y, w, h);

            if (isSelected) {
                ctx.strokeRect(x, y, w, h);
            }
        }
    }

    renderItemText(text: string, pass: RenderPass<TNode>, entry: IRenderEntry<TNode>) {

        const ctx = pass.getContext(), sizes = entry.sizes;
        if (!sizes) {
            return;
        }

        if (/*entry.isShadow == false &&*/ pass.getTree().getTreeState().isSelected(entry.node) || entry.dndPlacement == Placement.INSIDE) {
            ctx.fillStyle = pass.getTheme().textSelected;
        } else {
            ctx.fillStyle = pass.getTheme().text;
        }

        ctx.fillText(
            text,
            Math.round(sizes.text.getLeft(pass.getViewPort())) - 0.5,
            Math.round(sizes.text.getCenterY(pass.getViewPort())) - 0.5);
    }

    renderScrollBar(pass: RenderPass<TNode>, totalLineCount: number) {

        const ctx = pass.getContext();

        const totalHeight = totalLineCount * pass.getTree().getTreeRenderSettings().itemHeight;
        const visibleLines = (ctx.canvas.height / pass.getTree().getTreeRenderSettings().itemHeight);
        const percentageVisible = visibleLines / totalLineCount;

        this._previousTotalHeight = totalHeight;
        if (percentageVisible >= 1) {

            // No need for a scroll bar
            return;
        }

        const viewPortY = pass.getViewPort().yOffset;

        const percentageOffset = (viewPortY == 0) ? 0 : (viewPortY / totalHeight);

        const x = ctx.canvas.width - 10;
        const y = ctx.canvas.height * percentageOffset;
        const w = 10;
        const h = ctx.canvas.height * percentageVisible;

        ctx.fillStyle = pass.getTheme().scrollbarFillColor;
        ctx.strokeStyle = pass.getTheme().scrollbarStrokeColor;
        ctx.fillRect(x, y, w, h);
    }

    getPreviousTotalHeight() {
        return this._previousTotalHeight;
    }
}

