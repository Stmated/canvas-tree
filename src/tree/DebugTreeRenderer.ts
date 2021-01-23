import {AbstractTreeRenderer} from "./render/AbstractTreeRenderer";

export default class DebugTreeRenderer<T> extends AbstractTreeRenderer<T> {

    public getText(node: T, callback: {(data: string): void}) {

        if (node instanceof String) {
            callback("" + node);
        } else {
            callback("" + JSON.stringify(node));
        }
    }

    public getIconKey(node: T, callback: {(data: string): void}) {
        callback("" + node);
    }
}