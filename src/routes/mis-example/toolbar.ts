import type {Rectangle} from "./component";
import {get} from "svelte/store";
import {canvasOffsetX, canvasOffsetY, components} from "./state";

export function addRectangle() {
    const rectangle: Rectangle = {
        id: crypto.randomUUID(),
        position: {
            x: get(canvasOffsetX) + 400,
            y: get(canvasOffsetY) + 400,
            width: 200,
            height: 100
        },
        type: "rectangle",
        color: "#1c65b4",
        frame: null
    }

    components.update(value => [...value, rectangle]);
}