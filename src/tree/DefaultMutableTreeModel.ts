import {IChangedListener} from "./core/IChangedListener";
import {ITreeModel} from "./core/ITreeModel";

export class DefaultMutableTreeModel<TNode> implements ITreeModel<TNode> {

    private readonly _root: TNode;
    private readonly _children: Map<TNode, TNode[]> = new Map<TNode, TNode[]>(); // {[key: TNode]: TNode[]} = {};
    private readonly _listeners: IChangedListener[] = [];

    constructor(root: TNode) {
        this._root = root;
    }

    getRoot(): TNode {
        return this._root;
    }

    getChildren(parent: TNode): TNode[] | undefined {

        if (this._children.has(parent)) {
            return this._children.get(parent);
        } else {
            return undefined;
        }
    }

    getChildCount(parent: TNode): number | undefined {

        let children = this.getChildren(parent);
        if (children) {
            return children.length;
        } else {
            return 0;
        }
    }

    getChild(parent: TNode, index: number): TNode | undefined {
        let children = this.getChildren(parent);
        if (!children) {
            return undefined;
        }

        return children[index];
    }

    public addChangedListener(listener: IChangedListener) {
        this._listeners.push(listener);
    }

    public removeChangedListener(listener: IChangedListener) {
        const idx = this._listeners.indexOf(listener);
        this._listeners.splice(idx, 1);
    }

    public add(parent: TNode | null, child: TNode, modifyParent: boolean = true, index?: number) {

        if (parent && modifyParent) {

            let parentChildren = this.getChildren(parent);
            if (!parentChildren) {
                this._children[<any>parent] = parentChildren = [];
            }

            if (parentChildren.indexOf(child) == -1) {
                if (!index && index !== 0) {
                    index = parentChildren.length;
                }

                parentChildren.splice(index, 0, child);
            }
        }
    }

    public clearChildren(parent: TNode) {
        this._children.set(parent, []);
    }

    public remove(parent: TNode, child: TNode) {

        let parentChildren = this.getChildren(parent);
        if (parentChildren == null) {

            // The parent doesn't exist.
            return;
        }

        let idx = parentChildren.indexOf(child);
        if (idx != -1) {

            this.removeRecursively(child);
            parentChildren.splice(idx, 1);

            // if (child && this._root && child == this._root) {
            //     this._root = "";
            // }
        }
    }

    private removeRecursively(child: TNode) {

        // Iterate through all children and remove them as well.
        // The removal is done depth-first.
        let childChildren = this.getChildren(child);
        if (childChildren) {
            for (let i = 0; i < childChildren.length; i++) {
                let subChildId = childChildren[i];
                this.removeRecursively(subChildId);
            }

            // Remove the children property.
            // If anyone tries to access it, then it will be gone.
            delete this._children[<any>child];
        }
    }
}