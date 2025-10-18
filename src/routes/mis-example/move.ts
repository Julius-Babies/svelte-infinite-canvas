import type {Component} from "./component";
import {selectedComponents} from "./selection";
import {get} from "svelte/store";
import {components} from "./state";

let componentsBeforeMove: Component[] | null = null;
let mouseBeforeMove: {x: number; y: number} | null = null;
export function setMouseBeforeMove(x: number, y: number) {
    mouseBeforeMove = {x, y};
}

export function move(draggedComponent: Component, mouseX: number, mouseY: number) {
    if (!get(selectedComponents).includes(draggedComponent)) selectedComponents.set([draggedComponent]);
    if (!componentsBeforeMove) {
        console.log("Setting components before move");
        componentsBeforeMove = Object.create([...get(selectedComponents)]);
    }

    const boundingRect = {
        x: Math.min(...componentsBeforeMove!.map(r => r.position.x)),
        y: Math.min(...componentsBeforeMove!.map(r => r.position.y)),
        width: Math.max(...componentsBeforeMove!.map(r => r.position.x + r.position.width)) - Math.min(...componentsBeforeMove!.map(r => r.position.x)),
        height: Math.max(...componentsBeforeMove!.map(r => r.position.y + r.position.height)) - Math.min(...componentsBeforeMove!.map(r => r.position.y))
    }

    const mouseXDelta = mouseX - mouseBeforeMove!.x;
    const mouseYDelta = mouseY - mouseBeforeMove!.y;

    components.update(components => {
        return components.map(component => {
            if (!get(selectedComponents).includes(component)) return component;
            const originalPosition = componentsBeforeMove?.find(c => c.id === component.id)?.position
            if (!originalPosition) throw new Error("Component not found");
            return {
                ...component,
                position: {
                    ...component.position,
                    x: originalPosition.x + mouseXDelta,
                    y: originalPosition.y + mouseYDelta,
                }
            }
        });
    })

    selectedComponents.update(selected => {
        const ids = selected.map(c => c.id)
        return get(components).filter(c => ids.includes(c.id))
    })
}

export function stopMove() {
    componentsBeforeMove = null;
    mouseBeforeMove = null;
}