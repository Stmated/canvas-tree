import {IImageProvider} from "../core/AbstractComponent";

export interface IIconLoadedCallback {
    (provider: IImageProvider | null, image: HTMLImageElement): void;
}