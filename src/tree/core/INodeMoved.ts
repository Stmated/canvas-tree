import {INodeMovedArgs} from "./INodeMovedArgs";
import {INodeMovedResultArgs} from "./INodeMovedResultArgs";

export interface INodeMoved<TNode> {
    (args: INodeMovedArgs<TNode>): INodeMovedResultArgs<TNode>;
}