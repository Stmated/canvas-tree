import {AbstractTree} from "./AbstractTree";
import {ICallback1} from "./core/AbstractComponent";
import {RenderPass} from "./render/RenderPass";

export default class DefaultTree extends AbstractTree<string> {

    protected onKeyDown(event: KeyboardEvent, node: string | null): void {

    }

    onNodeMoved(pass: RenderPass<string>): void {

    }

    isDndTargetAllowed(source: string, targets: string[], callback: ICallback1<boolean | null>): void {

    }
}