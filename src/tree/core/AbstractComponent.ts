
export class AbstractComponent {

    protected _viewPort: IViewPort = {xOffset: 0, yOffset: 0};

    protected physicalToVirtual(p: IPoint): IPoint {
        return {
            x: (p.x + this._viewPort.xOffset),
            y: (p.y + this._viewPort.yOffset)
        };
    }

    protected static getCanvasMousePosition(canvas: HTMLCanvasElement, evt: MouseEvent): IPoint {

        const rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
            y: Math.round((evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
        };
    }
}

export interface IHTMLElementCallback<THTMLElement extends HTMLElement> {
    (): THTMLElement;
}

export interface IViewPort {
    xOffset: number;
    yOffset: number;
}

export interface ISize {

    width: number;
    height: number;
}

export interface IPoint {
    x: number;
    y: number;
}

export interface IRectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

export class VirtualPoint {

    private _point: IPoint;

    constructor(point: IPoint) {
        this._point = point;
    }

    getX(viewPort?: IViewPort): number {
        if (viewPort) {
            return this._point.x - viewPort.xOffset;
        }
        return this._point.x;
    }

    getY(viewPort?: IViewPort): number {
        if (viewPort) {
            return this._point.y - viewPort.yOffset;
        }

        return this._point.y;
    }
}

export class VirtualRectangle {

    private _point: VirtualPoint;
    private _size: ISize;

    constructor(rectangle: IRectangle) {
        this._point = new VirtualPoint({x: rectangle.x, y: rectangle.y});
        this._size = {width: rectangle.width, height: rectangle.height};
    }

    getTop(viewPort?: IViewPort): number {
        return this._point.getY(viewPort);
    }

    getRight(viewPort?: IViewPort): number {
        return this._point.getX(viewPort) + this.getWidth();
    }

    getBottom(viewPort?: IViewPort): number {
        return this._point.getY(viewPort) + this.getHeight();
    }

    getLeft(viewPort?: IViewPort): number {
        return this._point.getX(viewPort);
    }

    getWidth(): number {
        return this._size.width;
    }

    getHeight(): number {
        return this._size.height;
    }

    getHalfWidth(): number {
        return this.getWidth() / 2;
    }

    getHalfHeight(): number {
        return this.getHeight() / 2;
    }

    getCenterX(viewPort?: IViewPort): number {
        return this.getLeft(viewPort) + this.getHalfWidth();
    }

    getCenterY(viewPort?: IViewPort): number {
        return this.getTop(viewPort) + this.getHalfHeight();
    }

    isMatch(virtualPoint: IPoint, fuzz: number = 0): boolean {

        if (this.getRight() + fuzz < virtualPoint.x
            || this.getBottom() + fuzz < virtualPoint.y
            || this.getLeft() - fuzz > virtualPoint.x
            || this.getTop() - fuzz > virtualPoint.y) {

            // This hit test failed, since the point was either before or after the rectangle.
            return false;
        }

        return true;
    }
}

export class VirtualLine {

    private _pointSmallestX: VirtualPoint;
    private _pointLargestX: VirtualPoint;
    private _pointSmallestY: VirtualPoint;
    private _pointLargestY: VirtualPoint;

    constructor(point1: IPoint, point2: IPoint) {

        if (point1.x < point2.x) {
            this._pointSmallestX = new VirtualPoint(point1);
            this._pointLargestX = new VirtualPoint(point2);
        } else {
            this._pointSmallestX = new VirtualPoint(point2);
            this._pointLargestX = new VirtualPoint(point1);
        }

        if (point1.y < point2.y) {
            this._pointSmallestY = new VirtualPoint(point1);
            this._pointLargestY = new VirtualPoint(point2);
        } else {
            this._pointSmallestY = new VirtualPoint(point2);
            this._pointLargestY = new VirtualPoint(point1);
        }
    }

    getTop(viewPort?: IViewPort): number {
        return this._pointSmallestY.getY(viewPort);
    }

    getRight(viewPort?: IViewPort): number {
        return this._pointLargestX.getX(viewPort);
    }

    getBottom(viewPort?: IViewPort): number {
        return this._pointLargestY.getY(viewPort);
    }

    getLeft(viewPort?: IViewPort): number {
        return this._pointSmallestX.getX(viewPort);
    }

    getHeight(): number {
        return this.getBottom() - this.getTop();
    }

    getWidth(): number {
        return this.getRight() - this.getLeft();
    }
}

export interface IStringAnyMap {
    [s: string]: any;
}

export interface ISubscriptionCallback<T> {
    (response: T): void;
}

export interface ICallback {
    (): void;
}

export interface ICallback1<T> {
    (value: T): void;
}

export interface ICallback2<T1, T2> {
    (a: T1, b: T2): void;
}

export interface IImageProviderCallback {
    (provider: IImageProvider, imageBase64: string): void;
}

export interface IImageProviderRequest {
    key: string,
    fallback?: string,
    callback: IImageProviderCallback
}

export interface IImageProviderResponse {
    key: string,
    base64: string
}

export interface IImageProvider {
    getImage(request: IImageProviderRequest): boolean;
}