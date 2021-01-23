import {IStateChangedListener} from "./core/IStateChangedListener";
import {ITreeState} from "./core/ITreeState";

export class DefaultTreeState<TNode> implements ITreeState<TNode> {

    private _id: string | null;

    private readonly _selected: TNode[];
    private readonly _expanded: TNode[];
    private readonly _locked: TNode[];

    private _selectionListeners: IStateChangedListener<TNode>[] = [];
    private _expansionListeners: IStateChangedListener<TNode>[] = [];

    private readonly _loadedSelected: TNode[] = [];
    private readonly _loadedExpanded: TNode[] = [];

    constructor(id: string | null = null, selected: TNode[] = [], expanded: TNode[] = [], locked: TNode[] = []) {
        this._id = id;

        if (this._id) {

            // TODO: Move this elsewhere
            this._loadedSelected = JSON.parse(localStorage.getItem(`${this._id}_selected`) || '[]');
            this._loadedExpanded = JSON.parse(localStorage.getItem(`${this._id}_expanded`) || '[]');
        }

        this._selected = selected;
        this._expanded = expanded;
        this._locked = locked;
    }

    public load() {

        const state = this;

        const toExpand = state._loadedExpanded;
        const toSelect = state._loadedSelected;
        state._loadedExpanded.length = 0;
        state._loadedSelected.length = 0;

        let expandIndex = 0;
        let selectIndex = 0;

        const expansionListener: IStateChangedListener<TNode> = (node) => {
            if (toExpand.indexOf(node) != -1) {
                if (++expandIndex < toExpand.length) {
                    state.setExpanded(toExpand[expandIndex], true, true);
                    return true;
                }
            }

            // The user has either started clicking around, or we've expanded all.
            state.removeExpansionChangedListener(expansionListener);
        };

        const selectionListener: IStateChangedListener<TNode> = (node) => {
            if (toSelect.indexOf(node) != -1) {
                if (++selectIndex < toSelect.length) {
                    state.setSelected(toSelect[selectIndex], true, true);
                    return true;
                }
            }

            // The user has either started selecting own stuff, or we've selected all of them.
            state.removeSelectionChangedListener(selectionListener);
        };

        if (toExpand.length > 0) {
            state.addExpansionChangedListener(expansionListener);
            state.setExpanded(toExpand[expandIndex], true, true);
        }

        if (toSelect.length > 0) {
            state.addSelectionChangedListener(selectionListener);
            state.setSelected(toSelect[selectIndex], true, true);
        }
    }

    public isSelected(node: TNode): boolean {
        return this._selected.indexOf(node) != -1;
    }

    public isExpanded(node: TNode): boolean {
        return this._expanded.indexOf(node) != -1;
    }

    public setSelected(node: TNode, selected: boolean, fire: boolean) {
        if (selected) {
            if (this.isSelected(node) == false) {
                this._selected.push(node);
                if (fire) DefaultTreeState.fire(node, false, true, this._selectionListeners);
            }
        } else {
            if (this.isSelected(node)) {
                const idx = this._selected.indexOf(node);
                this._selected.splice(idx, 1);
                if (fire) DefaultTreeState.fire(node, true, false, this._selectionListeners);
            }
        }

        if (fire && this._id) {
            localStorage.setItem(this._id + "_selected", JSON.stringify(this._selected));
        }

        return Promise.resolve();
    }

    public setExpanded(node: TNode, expanded: boolean, fire: boolean = true, force: boolean = false) {

        if (this.isLocked(node) == false) {
            if (expanded) {
                if (this.isExpanded(node) == false) {
                    this._expanded.push(node);
                    if (fire) DefaultTreeState.fire(node, false, true, this._expansionListeners);
                }
            } else {
                if (this.isExpanded(node)) {

                    const idx = this._expanded.indexOf(node);
                    this._expanded.splice(idx, 1);
                    if (fire) DefaultTreeState.fire(node, true, false, this._expansionListeners);
                }
            }

            if (fire && this._id) {
                localStorage.setItem(this._id + "_expanded", JSON.stringify(this._expanded));
            }
        }

        return Promise.resolve();
    }

    public isLocked(node: TNode) {
        return this._locked.indexOf(node) != -1;
    }

    public setLocked(node: TNode, locked: boolean) {
        if (locked) {
            if (this.isLocked(node) == false) {
                this._locked.push(node);
            }
        } else {
            if (this.isLocked(node)) {
                const idx = this._selected.indexOf(node);
                this._locked.splice(idx, 1);
            }
        }
    }

    private static fire<TNode>(node: TNode, previous: boolean, current: boolean, listeners: IStateChangedListener<TNode>[]) {

        for (let i = 0; i < listeners.length; i++) {
            const listener = listeners[i];
            listener(node, previous, current);
        }
    }

    getSelected(): TNode[] {
        return this._selected;
    }

    getExpanded(): TNode[] {
        return this._expanded;
    }

    public clearSelection() {

        while (this._selected.length > 0) {
            const node = this._selected[0];
            this.setSelected(node, false, false);
        }

        DefaultTreeState.fire(null, true, false, this._selectionListeners as any);

        if (this._id) {
            localStorage.setItem(this._id + "_selected", JSON.stringify(this._selected));
        }
    }

    public clearExpansion() {

        while (this._expanded.length > 0) {
            const node = this._expanded[0];
            this.setExpanded(node, false, false);
        }

        DefaultTreeState.fire(null, true, false, this._expansionListeners as any);

        if (this._id) {
            localStorage.setItem(this._id + "_expanded", JSON.stringify(this._expanded));
        }
    }

    addSelectionChangedListener(listener: IStateChangedListener<TNode>) {
        this._selectionListeners.push(listener);
    }

    addExpansionChangedListener(listener: IStateChangedListener<TNode>) {
        this._expansionListeners.push(listener);
    }

    removeSelectionChangedListener(listener: IStateChangedListener<TNode>) {
        const idx = this._selectionListeners.indexOf(listener);
        this._selectionListeners.splice(idx, 1);
    }

    removeExpansionChangedListener(listener: IStateChangedListener<TNode>) {
        const idx = this._expansionListeners.indexOf(listener);
        this._expansionListeners.splice(idx, 1);
    }
}