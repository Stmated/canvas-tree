import {IChangedListener} from "./IChangedListener";

export interface ITreeModel<TNode> {

    getRoot(): TNode | undefined;

    getChildCount(parent: TNode): number | undefined;

    getChild(parent: TNode, index: number): TNode | undefined;

    addChangedListener(listener: IChangedListener): void;

    removeChangedListener(listener: IChangedListener): void;
}