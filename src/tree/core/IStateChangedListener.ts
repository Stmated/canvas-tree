export interface IStateChangedListener<TNode> {
    (node: TNode, previous: boolean, current: boolean): void;
}