import {ItemMeasurements} from "./ItemMeasurements";

export interface IHitResult<TNode> {

    node?: TNode;

    /**
     * TODO: Change this into an array! Should be able to get all clicked layers!
     */
    areaName?: string;
    measurement?: ItemMeasurements
}