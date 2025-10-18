import type {Position} from "$lib/canvas/position";

export interface BaseComponent {
    id: string;
    frame: string | null;
    position: Position
}

export type Component = Rectangle;

export interface Rectangle extends BaseComponent {
    color: string;
    type: "rectangle";
}

