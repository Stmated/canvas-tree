import {ICallback, IImageProvider} from "../core/AbstractComponent";
import {RenderPass} from "./RenderPass";
import {IRenderEntry} from "../core/IRenderEntry";
import {ThemeProvider} from "./ThemeProvider";

export interface ITreeRenderer<TNode> {

    /**
     * Get the number of times the renderer has been called to start a new rendering pass.
     */
    getRenderCount(): number;

    getText(node: TNode, callback: { (data: string): void }): void;

    getIconKey(node: TNode, callback: { (data: string): void }): void;

    getPreviousTotalHeight(): number;

    getThemeProvider(): ThemeProvider;

    setSizeMultiplier(value: number): void;

    /**
     * Add an image provider for supplying the icons for the tree.
     *
     * @param provider
     */
    addImageProvider(provider: IImageProvider): void;

    renderBackground(pass: RenderPass<TNode>): void;

    renderBorder(pass: RenderPass<TNode>): void;

    renderItem(pass: RenderPass<TNode>, entry: IRenderEntry<TNode>): void;

    renderItemLine(pass: RenderPass<TNode>, entry: IRenderEntry<TNode>): void;

    renderItemBox(pass: RenderPass<TNode>, entry: IRenderEntry<TNode>): void;

    renderItemBoxPlus(pass: RenderPass<TNode>, entry: IRenderEntry<TNode>): void;

    renderItemBoxMinus(pass: RenderPass<TNode>, entry: IRenderEntry<TNode>): void;

    renderItemIcon(pass: RenderPass<TNode>, entry: IRenderEntry<TNode>): void;

    renderItemFocus(pass: RenderPass<TNode>, entry: IRenderEntry<TNode>): void;

    renderItemText(text: string, pass: RenderPass<TNode>, entry: IRenderEntry<TNode>): void;

    renderScrollBar(pass: RenderPass<TNode>, totalLineCount: number): void;

    renderDnd(pass: RenderPass<TNode>, entry: IRenderEntry<TNode>): void;

    addInvalidationListener(listener: ICallback): void;
}