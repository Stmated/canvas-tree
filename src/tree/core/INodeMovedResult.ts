import {INodeMovedResultArgs} from "./INodeMovedResultArgs";

export interface INodeMovedResult<TNode> {
    (args: INodeMovedResultArgs<TNode>): void;
}