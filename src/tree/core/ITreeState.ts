import {IStateChangedListener} from "./IStateChangedListener";

export interface ITreeState<TNode> {

    isSelected(node: TNode): boolean;

    isExpanded(node: TNode): boolean;

    isLocked(node: TNode): boolean;

    setSelected(node: TNode, selected: boolean, fire: boolean): Promise<void>;

    setExpanded(node: TNode, expanded: boolean, fire: boolean, force?: boolean): Promise<void>;

    getSelected(): TNode[];

    getExpanded(): TNode[];

    clearSelection(): void;

    clearExpansion(): void;

    addSelectionChangedListener(listener: IStateChangedListener<TNode>): void;

    addExpansionChangedListener(listener: IStateChangedListener<TNode>): void;

    removeSelectionChangedListener(listener: IStateChangedListener<TNode>): void;

    removeExpansionChangedListener(listener: IStateChangedListener<TNode>): void;
}