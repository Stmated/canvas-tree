import {IPoint, IViewPort} from "../core/AbstractComponent";
import {IHitResult} from "./IHitResult";
import {Placement} from "./Placement";
import {ITree} from "../core/ITree";
import {Theme} from "./Theme";
import {ItemMeasurements} from "./ItemMeasurements";

export class RenderPass<TNode> {

    private readonly _tree: ITree<TNode>;
    private readonly _viewPort: IViewPort;
    private readonly _hitTest: IPoint | undefined;
    private _hitTestResult?: IHitResult<TNode>;
    private readonly _itemTest: TNode | undefined;
    private _itemResultResult?: ItemMeasurements;
    private _dndTargetPoint?: IPoint;
    private _dndSourceNodes?: TNode[];
    private _dndTargetNode?: TNode;
    private _dndTargetPlacement?: Placement;
    private _dndAllowed: boolean = true;
    private _abort: boolean = false;
    private _ctx?: CanvasRenderingContext2D;
    private _lastRenderedLineNumber: number = -1;
    private readonly _theme: Theme;

    constructor(tree: ITree<TNode>, viewPort: IViewPort, theme: Theme, hitTest?: IPoint, itemTest?: TNode) {
        this._tree = tree;
        this._viewPort = viewPort;
        this._theme = theme;
        this._hitTest = hitTest;
        this._itemTest = itemTest;
    }

    isAborted() {
        return this._abort;
    }

    abort() {
        this._abort = true;
    }

    getTree(): ITree<TNode> {
        return this._tree;
    }

    getViewPort(): IViewPort {
        return this._viewPort;
    }

    getTheme(): Theme {
        return this._theme;
    }

    getContext(): CanvasRenderingContext2D {

        if (!this._ctx) {
            throw new Error("Not allowed to get the context before it has been set");
        }

        return this._ctx;
    }

    setContext(value: CanvasRenderingContext2D) {
        this._ctx = value;
    }

    getLastRenderedLineNumber(): number {
        return this._lastRenderedLineNumber;
    }

    setLastRenderedLineNumber(value: number) {
        this._lastRenderedLineNumber = Math.max(this._lastRenderedLineNumber, value);
    }

    setDnd(sourceNodes: TNode[], targetPoint: IPoint) {
        this._dndSourceNodes = sourceNodes;
        this._dndTargetPoint = targetPoint;
    }

    getDndSourceNodes(): TNode[] {
        return this._dndSourceNodes || [];
    }

    getDndTargetPoint(): IPoint | undefined {
        return this._dndTargetPoint;
    }

    getDndTargetNode(): TNode | undefined {
        return this._dndTargetNode;
    }

    getDndTargetPlacement(): Placement | undefined {
        return this._dndTargetPlacement;
    }

    setDndTargetNode(node: TNode, placement: Placement) {
        this._dndTargetNode = node;
        this._dndTargetPlacement = placement;
    }

    setDndAllowed(value: boolean) {
        this._dndAllowed = value;
    }

    isDndAllowed() {
        return this._dndAllowed;
    }

    getHitTest(): IPoint | undefined {
        return this._hitTest;
    }

    setHitTestResult(value: IHitResult<TNode>) {
        this._hitTestResult = value;
    }

    getHitTestResult(): IHitResult<TNode> | undefined {
        return this._hitTestResult;
    }

    getItemTest(): TNode | undefined {
        return this._itemTest;
    }

    setItemTestResult(value: ItemMeasurements) {
        this._itemResultResult = value;
    }

    getItemTestResult(): ItemMeasurements | undefined {
        return this._itemResultResult;
    }
}