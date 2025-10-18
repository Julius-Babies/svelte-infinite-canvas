import type {Component} from "./component";
import {initial as initialFrames} from "./frame";
import {writable} from "svelte/store";

export let components = writable<Component[]>([]);
export let frames = writable(initialFrames);

export let canvasScale = writable(.4);
export let canvasOffsetX = writable(100);
export let canvasOffsetY = writable(200);

export let canvasMousePosition = writable({x: 0, y: 0});

export function screenToWorld(
    mouseX: number,
    mouseY: number,
    canvasBoundingRect: DOMRect,
    x: number,
    y: number,
    scale: number
): { worldX: number; worldY: number } {
    const localX = mouseX - canvasBoundingRect.left;
    const localY = mouseY - canvasBoundingRect.top;

    const worldX = (localX - x * scale) / scale;
    const worldY = (localY - y * scale) / scale;

    return { worldX, worldY };
}