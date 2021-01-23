import {ITreeRenderer} from "../render/ITreeRenderer";
import {ITreeState} from "./ITreeState";
import {ITreeModel} from "./ITreeModel";
import {RenderPass} from "../render/RenderPass";
import {ICallback1, IPoint} from "./AbstractComponent";
import {IHitResult} from "../render/IHitResult";
import {INodeMoved} from "./INodeMoved";
import {ItemMeasurements} from "../render/ItemMeasurements";
import {IRenderSettings} from "./IRenderSettings";

export interface ITree<TNode> {

    getTreeRenderer(): ITreeRenderer<TNode>;

    getTreeState(): ITreeState<TNode>;

    getTreeModel(): ITreeModel<TNode>;

    getTreeRenderSettings(): IRenderSettings;

    setDnD(enabled: boolean): void;

    invalidate(): RenderPass<TNode>;

    getNodeAtPhysical(physicalPosition: IPoint): IHitResult<TNode>;

    getNodeAtVirtual(physicalPosition: IPoint): IHitResult<TNode>;

    getPositionOf(node: TNode): ItemMeasurements;

    addNodeMovedListener(listener: INodeMoved<TNode>): void;

    isDndTargetAllowed(source: TNode, targets: TNode[], callback: ICallback1<boolean | null>): void;
}