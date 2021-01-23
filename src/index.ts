import ISetupOptions from "./ISetupOptions";
import DefaultTree from "./tree/DefaultTree";
import DebugTreeRenderer from "./tree/DebugTreeRenderer";
import {DefaultTreeState} from "./tree/DefaultTreeState";
import {DefaultMutableTreeModel} from "./tree/DefaultMutableTreeModel";
import Defaults from "./tree/Defaults";

export default function(options: ISetupOptions) {

    const tree = new DefaultTree();
    const renderer = new DebugTreeRenderer();
    const state = new DefaultTreeState<string>();
    const model = new DefaultMutableTreeModel<string>("");

    tree.init(renderer, state, model, Defaults.getDefaultRenderSettings(), () => {
        return document.getElementById(options.elementId) as HTMLCanvasElement;
    });
}