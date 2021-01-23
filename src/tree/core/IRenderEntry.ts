import {Placement} from "../render/Placement";
import {ItemMeasurements} from "../render/ItemMeasurements";

export interface IRenderEntry<TNode> {

    node: TNode;
    isLast: boolean;
    dndPlacement?: Placement;
    sizes?: ItemMeasurements;
    line: number;
    parent: IRenderEntry<TNode> | null;
}