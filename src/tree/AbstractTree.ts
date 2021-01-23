
import {
    AbstractComponent,
    ICallback1,
    IHTMLElementCallback, IPoint,
    VirtualLine, VirtualRectangle
} from './core/AbstractComponent';
import {IRenderEntry} from "./core/IRenderEntry";
import {IHitResult} from "./render/IHitResult";
import {RenderPass} from "./render/RenderPass";
import {ITreeRenderer} from "./render/ITreeRenderer";
import {INodeMovedResultArgs} from "./core/INodeMovedResultArgs";
import {INodeMovedArgs} from "./core/INodeMovedArgs";
import {INodeMoved} from "./core/INodeMoved";
import {ITreeState} from "./core/ITreeState";
import {ITreeModel} from "./core/ITreeModel";
import {ITree} from "./core/ITree";
import {ItemMeasurements} from "./render/ItemMeasurements";
import {IRenderSettings} from "./core/IRenderSettings";
import {Placement} from "./render/Placement";

export abstract class AbstractTree<TNode> extends AbstractComponent implements ITree<TNode> {

    private _elementCanvasCallback?: IHTMLElementCallback<HTMLCanvasElement>;
    private readonly _moveListeners: INodeMoved<TNode>[] = [];

    private _renderer?: ITreeRenderer<TNode>;
    private _state?: ITreeState<TNode>;
    private _model?: ITreeModel<TNode>;

    private _initialSettings?: IRenderSettings;
    private _settings?: IRenderSettings;

    private _mouseIsDown: boolean = false;

    private _dndEnabled: boolean = true;
    private _dndVirtualStart: IPoint | null = null;
    private _dndVirtualStop: IPoint | null = null;

    public setZoom(value: number) {

        if (this._initialSettings) {

            this._settings = {...this._initialSettings};
            if (this._settings) {
                this._settings.boxHeight = this._settings.boxHeight * value;
                this._settings.boxWidth = this._settings.boxWidth * value;
                this._settings.depthMarginLeft = this._settings.depthMarginLeft * value;
                this._settings.fontHeight = this._settings.fontHeight * value;

                this._settings.iconWidth = this._settings.iconWidth * value;
                this._settings.iconHeight = this._settings.iconHeight * value;
                this._settings.iconPaddingRight = this._settings.iconPaddingRight * value;

                this._settings.itemHeight = this._settings.itemHeight * value;
                this._settings.itemMarginBottom = this._settings.itemMarginBottom * value;
                this._settings.itemPaddingLeft = this._settings.itemPaddingLeft * value;
                this._settings.itemPaddingTop = this._settings.itemPaddingTop * value;
            }
        }
    }

    public setDnD(enabled: boolean) {
        this._dndEnabled = enabled;
    }

    public getRenderer() {

        if (!this._renderer) {
            throw new Error("Not allowed to get renderer before it has been initialized");
        }

        return this._renderer;
    }

    updateScrollOffsetConstraints(canvasElement: HTMLCanvasElement) {

        const itemHeight = this.getTreeRenderSettings().itemHeight;

        let newYOffset = this._viewPort.yOffset;
        newYOffset = Math.min(this.getRenderer().getPreviousTotalHeight() - canvasElement.height + (itemHeight), newYOffset);
        newYOffset = Math.max(0, newYOffset);
        newYOffset = newYOffset - (newYOffset % itemHeight);

        this._viewPort.yOffset = newYOffset;
    }

    scrollToNode(node: TNode, canvasElement: HTMLCanvasElement) {

        const measurement = this.getPositionOf(node);
        if (measurement) {

            const viewTop = this._viewPort.yOffset;
            const viewBottom = this._viewPort.yOffset + canvasElement.height;

            if (measurement.item.getTop() < viewTop) {

                this._viewPort.yOffset = measurement.item.getTop();
                this.updateScrollOffsetConstraints(canvasElement);
                this.invalidate();
            } else if (measurement.item.getBottom() > viewBottom) {

                // Need to add half the item height, to be sure that the integral scrolling shows the whole line
                this._viewPort.yOffset = measurement.item.getBottom() - canvasElement.height + (this.getTreeRenderSettings().itemHeight / 2);
                this.updateScrollOffsetConstraints(canvasElement);
                this.invalidate();
            }
        }
    }

    init(renderer: ITreeRenderer<TNode>,
         state: ITreeState<TNode>,
         model: ITreeModel<TNode>,
         settings: IRenderSettings,
         canvasCallback: IHTMLElementCallback<HTMLCanvasElement>) {

        this._elementCanvasCallback = canvasCallback;
        this._renderer = renderer;
        this._state = state;
        this._model = model;
        this._initialSettings = settings;
        this._settings = {...{}, ...this._initialSettings};  //$.extend({}, this._initialSettings);

        renderer.addInvalidationListener(() => {
            this.invalidate();
        });

        model.addChangedListener(() => {
            this.invalidate();
        });

        const self = this;
        const canvasElement = this.getElementCanvas();
        //const $canvas = $(canvasElement);
        //$canvas.attr({'touch-action': 'pan-y'});
        canvasElement.setAttribute('touch-action', 'none');

        this._state.addExpansionChangedListener(function (node, previous, current) {

            // Expanding/Collapsing has been done, so let's update the scroller
            self.updateScrollOffsetConstraints(canvasElement);
        });

        this._state.addSelectionChangedListener(function (node, previous, current) {

            if (current && self.getTreeState().getSelected().length == 1) {
                self.scrollToNode(node, canvasElement);
            }
        });

        const isTouchEnabled = false; // TODO: Implement this again! // Modernizr.touchevents;
        let isPointerDown: boolean = false;
        let pointer_start_viewport_y: number = 0;
        let pointer_start_y: number = 0;

        canvasElement.addEventListener('pointerdown', function (event) {

            canvasElement.focus();
            if (isTouchEnabled) {
                isPointerDown = true;
                if (isPointerDown) {
                    pointer_start_viewport_y = self._viewPort.yOffset;
                    pointer_start_y = event.pageY || 0;
                }
            }
        });

        canvasElement.addEventListener('pointerup', () => {
            if (isPointerDown) {
                isPointerDown = false;
            }
        });

        canvasElement.addEventListener('pointermove', (event) => {
            if (isPointerDown) {

                const distance = pointer_start_y - (event.pageY || 0);
                self._viewPort.yOffset = pointer_start_viewport_y + distance;
                self.updateScrollOffsetConstraints(canvasElement);

                self.invalidate();
            }
        });

        canvasElement.addEventListener('mousewheel DOMMouseScroll', (e: any) => {

            // let a: MouseScrollEvent
            let event: WheelEvent = window.event ? (<WheelEvent>window.event) : (<WheelEvent>e.originalEvent);  // old IE support
            // const event = e as WheelEvent;
            event.preventDefault();

            let browserDelta = (-event.deltaY || -event.detail);
            if (Math.abs(browserDelta) > 100) {

                // Divide it by 100 to get a number in the range of maybe 1-9
                // This is used to represent acceleration according to how fast the user spun the wheel.
                browserDelta = (browserDelta / 100);
            } else {
                browserDelta = Math.max(-1, Math.min(1, browserDelta));
            }

            let itemHeight = self.getTreeRenderSettings().itemHeight;

            self._viewPort.yOffset = (self._viewPort.yOffset - (browserDelta * itemHeight) * 3);
            self.updateScrollOffsetConstraints(canvasElement);

            self.invalidate();
        });

        canvasElement.addEventListener('mousedown', function (e: MouseEvent) {

            canvasElement.focus();
            //const event = <MouseEvent> e.originalEvent;
            e.preventDefault();

            const button = e.which || e.button;
            self._mouseIsDown = button == 1;

            const pressedLocation = self.physicalToVirtual(AbstractTree.getCanvasMousePosition(canvasElement, e));
            if (self._dndEnabled) {
                self._dndVirtualStart = pressedLocation;
            }

            const hitTest_result = self.getNodeAtVirtual(pressedLocation);
            if (hitTest_result && hitTest_result.node) {

                if (hitTest_result.areaName == 'box' || hitTest_result.areaName == 'expand') {

                    if (self.getTreeModel().getChildCount(hitTest_result.node)) {
                        self.getTreeState().setExpanded(hitTest_result.node, !self.getTreeState().isExpanded(hitTest_result.node), true);
                    }

                } else if (isTouchEnabled == false || hitTest_result.areaName == 'text' || hitTest_result.areaName == 'icon') {

                    if (e.ctrlKey) {
                        self.getTreeState().setSelected(hitTest_result.node, !self.getTreeState().isSelected(hitTest_result.node), true);
                    } else {

                        if (self.getTreeState().isSelected(hitTest_result.node) == false) {

                            if (e.which != 1) {
                                self.getTreeState().clearSelection();
                            }
                        }

                        if (self.getTreeState().isSelected(hitTest_result.node) == false || self.getTreeState().getSelected().length > 1) {

                            if (e.which == 1) {

                                // Mouse-down on unselected node will clear all other selections.
                                // Or if there currently are multiple nodes selected, all are removed in favor of the clicked.
                                self.getTreeState().clearSelection();
                            }
                        }

                        self.getTreeState().setSelected(hitTest_result.node, true, true);
                    }
                }

                self.invalidate();
            }
        });

        canvasElement.addEventListener('mouseup', function (e) {
            e.preventDefault();

            if (self._mouseIsDown) {

                const pass = self.invalidate();
                self._mouseIsDown = false;
                self._dndVirtualStart = null;
                self._dndVirtualStop = null;

                // Render again after the DnD has been removed
                self.invalidate();

                if (pass.getDndTargetNode() && pass.isDndAllowed()) {
                    self.onNodeMoved(pass);
                }

                const $body = document.getElementsByTagName("body")[0];
                $body.classList.toggle('dragging-above', false);
                $body.classList.toggle('dragging-below', false);
                $body.classList.toggle('dragging-inside', false);
            }
        });

        canvasElement.addEventListener('mousemove', function (e: MouseEvent) {

            //const event = <MouseEvent> e.originalEvent;

            e.preventDefault();

            if (self._mouseIsDown && self._dndEnabled) {

                const stop = self.physicalToVirtual(AbstractTree.getCanvasMousePosition(canvasElement, e));

                const startPoint = (self._dndVirtualStart || {x: 0, y: 0});
                let x2 = stop.x;
                const x1 = startPoint.x;
                let y2 = stop.y;
                const y1 = startPoint.y;
                const d = Math.sqrt((x2 -= x1) * x2 + (y2 -= y1) * y2);

                if (d > 0) {
                    self._dndVirtualStop = stop;
                    const pass = self.invalidate();

                    const $body = document.getElementsByTagName("body")[0];
                    $body.classList.toggle('dragging-above', pass.getDndTargetPlacement() == Placement.ABOVE);
                    $body.classList.toggle('dragging-below', pass.getDndTargetPlacement() == Placement.BELOW);
                    $body.classList.toggle('dragging-inside', pass.getDndTargetPlacement() == Placement.INSIDE);
                }
            }
        });

        canvasElement.addEventListener('dblclick', function (e: MouseEvent) {

            canvasElement.focus();
            //const event = <MouseEvent> e.originalEvent;

            const mousePos = AbstractTree.getCanvasMousePosition(canvasElement, e);
            const hitTest_result = self.getNodeAtPhysical(mousePos);
            if (hitTest_result && hitTest_result.node) {

                if (hitTest_result.areaName == 'box' || hitTest_result.areaName == 'expand') {
                    // Do nothing here
                } else {

                    if (self.getTreeModel().getChildCount(hitTest_result.node)) {
                        self.getTreeState().setExpanded(hitTest_result.node, !self.getTreeState().isExpanded(hitTest_result.node), true);
                    }
                }

                self.invalidate();
            }
        });

        canvasElement.addEventListener('keydown', function (e: KeyboardEvent) {

            console.log("Keydown")
            //const event = <KeyboardEvent> e.originalEvent;
            e.preventDefault();

            const selected = self.getTreeState().getSelected();
            const node = selected.length > 0 ? selected[0] : null;

            if (node) {
                const measurements = self.getPositionOf(node);

                if (measurements) {

                    const step = ((self.getTreeRenderSettings().itemHeight / 2) + self.getTreeRenderSettings().itemMarginBottom);

                    // TODO: Replace this with standard JavaScript!
                    let newCoordinates;
                    switch (e.which) {
                        case 36: // home
                        {
                            self._viewPort.yOffset = 0;
                            self.updateScrollOffsetConstraints(canvasElement);
                        }
                            break;
                        case 35: // end
                        {
                            self._viewPort.yOffset = self.getRenderer().getPreviousTotalHeight();
                            self.updateScrollOffsetConstraints(canvasElement);
                        }
                            break;
                        case 33: // page up
                        {
                            self._viewPort.yOffset -= (canvasElement.height - step);
                            self.updateScrollOffsetConstraints(canvasElement);
                        }
                            break;
                        case 34: // page down
                        {
                            self._viewPort.yOffset += canvasElement.height;
                            self.updateScrollOffsetConstraints(canvasElement);
                        }
                            break;
                        case 13: // Enter
                        case 32: // Spacebar
                        {
                            self.getTreeState().setExpanded(node, !self.getTreeState().isExpanded(node), true);
                        }
                            break;
                        case 37: // left
                        {
                            if (self.getTreeModel().getChildCount(node) && self.getTreeState().isExpanded(node)) {

                                // If it is expanded, then collapse it.
                                self.getTreeState().setExpanded(node, false, true);
                            } else {

                                // Otherwise go to the first item above this one that is on another depth!
                                // TODO: Speed this up by adding a listener system to rendering, so we can callback at each node (no need to do multiple hit tests)
                                for (let y = measurements.item.getTop(); y > 0; y -= step) {

                                    const coordinates = {
                                        x: measurements.item.getRight(),
                                        y: y
                                    };
                                    const nodeAt = self.getNodeAtVirtual(coordinates);
                                    if (nodeAt && nodeAt.measurement && nodeAt.measurement.icon.getLeft() < measurements.icon.getLeft()) {

                                        // This object is on another depth than our originating one.
                                        // So it should be the one that we are currently looking for!
                                        self.getTreeState().clearSelection();
                                        if (nodeAt.node) {
                                            self.getTreeState().setSelected(nodeAt.node, true, true);
                                        }

                                        break;
                                    }
                                }
                            }
                        }
                            break;

                        case 38: // up
                        {
                            newCoordinates = {
                                x: measurements.item.getRight(),
                                y: (measurements.item.getTop() - step)
                            };
                        }
                            break;

                        case 39: // right
                        {
                            if (self.getTreeState().isExpanded(node) == false) {

                                if (self.getTreeModel().getChildCount(node)) {

                                    // If it is collapsed, then expand it.
                                    self.getTreeState().setExpanded(node, true, true);
                                }
                            } else {

                                // Otherwise go to the first child object.
                                if (self.getTreeModel().getChildCount(node)) {

                                    self.getTreeState().clearSelection();
                                    const child = self.getTreeModel().getChild(node, 0);
                                    if (child) {
                                        self.getTreeState().setSelected(child, true, true);
                                    }
                                }
                            }
                        }
                            break;

                        case 40: // down
                        {
                            newCoordinates = {
                                x: measurements.item.getRight(),
                                y: (measurements.item.getBottom() + step)
                            };
                        }
                            break;
                    }

                    if (newCoordinates) {
                        const hitTest_result = self.getNodeAtVirtual(newCoordinates);
                        if (hitTest_result && hitTest_result.node) {
                            self.getTreeState().clearSelection();
                            self.getTreeState().setSelected(hitTest_result.node, true, true);
                        }
                    }
                }
            }

            self.onKeyDown(e, node);
            self.invalidate();
        });

        window.addEventListener('resize', function () {

            // const $canvasElement = $(canvasElement);

            if (canvasElement.parentElement) {
                canvasElement.width = canvasElement.parentElement.offsetWidth;
                canvasElement.height = canvasElement.parentElement.offsetHeight;
            }

            self.invalidate();
        });

        window.dispatchEvent(new Event('resize'));
        // $(window).trigger('resize');
        self.invalidate();
    }

    public abstract onNodeMoved(pass: RenderPass<TNode>): void;

    protected abstract onKeyDown(event: KeyboardEvent, node: TNode | null): void;

    public abstract isDndTargetAllowed(source: TNode, targets: TNode[], callback: ICallback1<boolean | null>): void

    addNodeMovedListener(listener: INodeMoved<TNode>) {
        this._moveListeners.push(listener);
    }

    fireNodeMovedListeners(args: INodeMovedArgs<TNode>): INodeMovedResultArgs<TNode> | null {

        for (let i = 0; i < this._moveListeners.length; i++) {
            let result: INodeMovedResultArgs<TNode> = this._moveListeners[i](args);

            if (result.accepted == false) {
                return result;
            }
        }

        return null;
    }

    getTreeRenderer(): ITreeRenderer<TNode> {
        return this.getRenderer();
    }

    getTreeState(): ITreeState<TNode> {

        if (!this._state) {
            throw new Error("Not allowed to get tree state before tree is initialized");
        }

        return this._state;
    }

    getTreeModel(): ITreeModel<TNode> {

        if (!this._model) {
            throw new Error("Not allowed to get tree model before tree is initialized");
        }

        return this._model;
    }

    getTreeRenderSettings(): IRenderSettings {

        if (!this._settings) {
            throw new Error("Not allowed to get tree render settings before tree is initialized");
        }

        return this._settings;
    }

    public getElementCanvas(): HTMLCanvasElement {

        if (!this._elementCanvasCallback) {
            throw new Error("Not allowed to get tree element canvas before tree is initialized");
        }

        return this._elementCanvasCallback();
    }

    invalidate(): RenderPass<TNode> {
        const pass = new RenderPass<TNode>(this, this._viewPort, this.getRenderer().getThemeProvider().getTheme());
        this.call_render_engine(pass);
        return pass;
    }

    getNodeAtPhysical(physicalPosition: IPoint): IHitResult<TNode> {
        return this.getNodeAtVirtual(this.physicalToVirtual(physicalPosition));
    }

    getNodeAtVirtual(virtualPosition: IPoint): IHitResult<TNode> {

        const pass = new RenderPass<TNode>(this, this._viewPort, this.getRenderer().getThemeProvider().getTheme(), virtualPosition);
        this.call_render_engine(pass);

        const hitResult = pass.getHitTestResult();
        if (!hitResult) {
            return {};
        }

        return hitResult;
    }

    getPositionOf(node: TNode): ItemMeasurements {

        const pass = new RenderPass<TNode>(this, this._viewPort, this.getRenderer().getThemeProvider().getTheme(), undefined, node);
        this.call_render_engine(pass);

        const hitResult = pass.getItemTestResult();
        if (!hitResult) {
            const emptyRect = new VirtualRectangle({x: 0, y: 0, width: 0, height: 0});
            const emptyLine = new VirtualLine({x: 0, y: 0}, {x: 0, y: 0});
            return new ItemMeasurements(emptyRect, emptyRect, emptyRect, emptyRect, emptyRect, emptyRect, emptyLine, emptyLine);
        }

        return hitResult;
    }

    private call_render_engine(renderPass: RenderPass<TNode>) {

        // TODO: Cache this. Or how noticeable is it even?
        // const tree = this;
        const canvasElement = this.getElementCanvas();
        // canvasElement.setAttribute('data-invalidate', function () {
        //     tree.invalidate();
        // });

        const ctx = canvasElement.getContext('2d');
        if (!ctx) {
            console.log('Could not get the canvas context from element \'' + canvasElement + '\'');
            return;
        }

        // Set the found context to this current rendering pass.
        renderPass.setContext(ctx);

        // Get our assigned renderer...
        const renderer = this.getTreeRenderer();
        const doRender = !renderPass.getHitTest() && !renderPass.getItemTest();

        if (this._mouseIsDown && this._dndVirtualStop) {
            const pointStart = this._dndVirtualStart || {x: 0, y: 0};
            const distance = Math.sqrt(Math.pow(this._dndVirtualStop.x - pointStart.x, 2) + Math.pow(this._dndVirtualStop.y - pointStart.y, 2));

            if (distance > 5) {

                // If we've moved more than 5 pixels, then we'll count that as if drag & drop is activated.
                renderPass.setDnd(this.getTreeState().getSelected(), this._dndVirtualStop);
            }
        }

        if (doRender) {
            // Then paint the background and the border.
            // This will replace any previous painting and draw on-top of it.
            renderer.renderBackground(renderPass);
        }

        const root = this.getTreeModel().getRoot();
        if (root) {
            const rootEntry: IRenderEntry<TNode> = {
                node: root,
                isLast: true,
                line: 0,
                parent: null
            };

            this.start_item(renderPass, rootEntry, 0);
            const line = renderPass.getLastRenderedLineNumber();
            if (doRender) {
                renderer.renderBorder(renderPass);
                renderer.renderScrollBar(renderPass, line);
            }
        }
    }

    private start_item(pass: RenderPass<TNode>, entry: IRenderEntry<TNode>, line: number): number {

        const renderer = pass.getTree().getTreeRenderer();
        renderer.renderItem(pass, entry);
        pass.setLastRenderedLineNumber(line + 1);
        if (pass.isAborted()) {

            // If the rendering has been aborted, then we... well, abort.
            return 1;
        }

        let renderedCount = 1;
        const node = entry.node;
        const model = pass.getTree().getTreeModel();
        const state = pass.getTree().getTreeState();
        const childCount = model.getChildCount(node);
        if (childCount && state.isExpanded(node)) {

            for (let i = 0; i < childCount; i++) {

                const child = model.getChild(node, i);
                if (child) {
                    const childEntry: IRenderEntry<TNode> = {
                        node: child,
                        isLast: i == (childCount - 1),
                        line: line + renderedCount,
                        parent: entry
                    };

                    renderedCount += this.start_item(pass, childEntry, line + renderedCount);
                    if (pass.isAborted()) {
                        break;
                    }
                }
            }
        }

        return renderedCount;
    }
}