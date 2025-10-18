import type {Position} from "$lib/canvas/position";

export interface BaseComponent {
    id: string;
    frame: string | null;
    position: Position
}

export type Component = Rectangle | Ellipse;

export interface Rectangle extends BaseComponent {
    color: string;
    type: "rectangle";
}

export interface Ellipse extends BaseComponent {
    color: string;
    type: "ellipse";
}