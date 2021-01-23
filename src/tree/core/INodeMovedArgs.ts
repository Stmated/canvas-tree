import {INodeMovedResult} from "./INodeMovedResult";

export interface INodeMovedArgs<TNode> {
    node: TNode;
    previousParent: TNode;
    previousIndex: number;
    newParent: TNode;
    newIndex: number;
    test: boolean;
    callback: INodeMovedResult<TNode>
}