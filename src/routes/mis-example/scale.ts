import type {Component} from "./component";
import type {HandleType} from "./handle";
import {get} from "svelte/store";
import {selectedComponents} from "./selection";
import {calculateScaling} from "../canvas-example/util";
import {canvasScale, components, frames} from "./state";
import {usedSnappingLines} from "./move";

let componentsBeforeScale: Component[] | null = null;
let mouseBeforeScale: {x: number; y: number} | null = null;
export function setMouseBeforeScale(x: number, y: number) {
    mouseBeforeScale = {x, y};
}

export function scale(draggedComponent: Component, handle: HandleType, mouseX: number, mouseY: number, snap: boolean, centered: boolean, proportional: boolean) {
    if (!componentsBeforeScale) {
        componentsBeforeScale = Object.create([...get(selectedComponents)]);
    }

    const originalPosition = componentsBeforeScale!.find(component => component.id === draggedComponent.id)!.position;
    const originalWidth = originalPosition.width;
    const originalHeight = originalPosition.height;
    const originalX = originalPosition.x;
    const originalY = originalPosition.y;
    
    let deltaX = mouseX - mouseBeforeScale!.x;
    let deltaY = mouseY - mouseBeforeScale!.y;
    calculateScaling(
        originalX,
        originalY,
        originalWidth,
        originalHeight,
        centered,
        handle,
        deltaX,
        deltaY,
        false
    );
    const naiveResultNormalized = calculateScaling(
        originalX,
        originalY,
        originalWidth,
        originalHeight,
        centered,
        handle,
        deltaX,
        deltaY,
        true
    )

    let usedSnappingLinesInProcess = null
    
    const frame = get(frames).find(f => f.id === draggedComponent.frame);
    if (snap && frame) {
        const SNAP_DISTANCE = 16/get(canvasScale);

        usedSnappingLinesInProcess = {
            frameId: frame.id,
            x: [] as number[],
            y: [] as number[],
        }

        const selectedIds = get(selectedComponents).map(c => c.id);
        const snapComponents = get(components).filter(c => !selectedIds.includes(c.id));
        const snappingLines = {
            x: [
                frame.position.x,
                frame.position.x + frame.position.width/2,
                frame.position.x + frame.position.width,
                ...snapComponents.map(c => c.position.x),
                ...snapComponents.map(c => c.position.x + c.position.width/2),
                ...snapComponents.map(c => c.position.x + c.position.width),
            ],
            y: [
                frame.position.y,
                frame.position.y + frame.position.height/2,
                frame.position.y + frame.position.height,
                ...snapComponents.map(c => c.position.y),
                ...snapComponents.map(c => c.position.y + c.position.height/2),
                ...snapComponents.map(c => c.position.y + c.position.height),
            ]
        }

        const isHandleEast = handle === "ne" || handle === "e" || handle === "se"
        const isHandleWest = handle === "nw" || handle === "w" || handle === "sw"
        const isHandleNorth = handle === "n" || handle === "nw" || handle === "ne"
        const isHandleSouth = handle === "s" || handle === "sw" || handle === "se"

        const canChangeWest = handle === "nw" || handle === "w" || handle === "sw" || (centered && (handle === "ne" || handle === "e" || handle === "se"))
        const canChangeEast = handle === "ne" || handle === "e" || handle === "se" || (centered && (handle === "nw" || handle === "w" || handle === "sw"))
        const canChangeNorth = handle === "n" || handle === "nw" || handle === "ne" || (centered && (handle === "s" || handle === "sw" || handle === "se"))
        const canChangeSouth = handle === "s" || handle === "sw" || handle === "se" || (centered && (handle === "n" || handle === "nw" || handle === "ne"))

        console.log(isHandleWest, canChangeWest)
        if (isHandleWest || canChangeWest) {
            const nearestXSnap = snappingLines.x.sort((a, b) => Math.abs(a - naiveResultNormalized.scaledX) - Math.abs(b - naiveResultNormalized.scaledX))[0]
            const nearestXSnapDistance = Math.abs(nearestXSnap - naiveResultNormalized.scaledX)
            if (nearestXSnapDistance <= SNAP_DISTANCE) {
                const direction = nearestXSnap - naiveResultNormalized.scaledX > 0 ? 1 : -1
                const sign = isHandleWest ? -1 : 1
                deltaX += sign * direction * nearestXSnapDistance
                usedSnappingLinesInProcess.x.push(nearestXSnap);
            }
        } else if (isHandleEast || canChangeEast) {
            const nearestXSnap = snappingLines.x.sort((a, b) => Math.abs(a - naiveResultNormalized.scaledX - naiveResultNormalized.scaledWidth) - Math.abs(b - naiveResultNormalized.scaledX - naiveResultNormalized.scaledWidth))[0]
            const nearestXSnapDistance = Math.abs(nearestXSnap - naiveResultNormalized.scaledX - naiveResultNormalized.scaledWidth)
            if (nearestXSnapDistance <= SNAP_DISTANCE) {
                const direction = nearestXSnap - naiveResultNormalized.scaledX - naiveResultNormalized.scaledWidth > 0 ? 1 : -1
                const sign = isHandleEast ? -1 : 1
                deltaX += sign * direction * nearestXSnapDistance
                usedSnappingLinesInProcess.x.push(nearestXSnap);
            }
        }

        if (isHandleNorth || canChangeNorth) {
            const nearestYSnap = snappingLines.y.sort((a, b) => Math.abs(a - naiveResultNormalized.scaledY) - Math.abs(b - naiveResultNormalized.scaledY))[0]
            const nearestYSnapDistance = Math.abs(nearestYSnap - naiveResultNormalized.scaledY)
            if (nearestYSnapDistance <= SNAP_DISTANCE) {
                const direction = nearestYSnap - naiveResultNormalized.scaledY > 0 ? 1 : -1
                const sign = isHandleNorth ? -1 : 1
                deltaY += sign * direction * nearestYSnapDistance
                usedSnappingLinesInProcess.y.push(nearestYSnap);
            }
        } else if (isHandleSouth || canChangeSouth) {
            const nearestYSnap = snappingLines.y.sort((a, b) => Math.abs(a - naiveResultNormalized.scaledY - naiveResultNormalized.scaledHeight) - Math.abs(b - naiveResultNormalized.scaledY - naiveResultNormalized.scaledHeight))[0]
            const nearestYSnapDistance = Math.abs(nearestYSnap - naiveResultNormalized.scaledY - naiveResultNormalized.scaledHeight)
            if (nearestYSnapDistance <= SNAP_DISTANCE) {
                const direction = nearestYSnap - naiveResultNormalized.scaledY - naiveResultNormalized.scaledHeight > 0 ? 1 : -1
                const sign = isHandleSouth ? -1 : 1
                deltaY += sign * direction * nearestYSnapDistance
                usedSnappingLinesInProcess.y.push(nearestYSnap);
            }
        }
    }

    if (proportional && (handle === "nw" || handle === "ne" || handle === "se" || handle === "sw")) {
        if (handle === "se") {
            const a = originalHeight / originalWidth;
            const b = 0
            const f = (x: number) => a * x + b;
            const y = f(deltaX);
            if (y > deltaY) {
                deltaX = (deltaY - b) / a;
            } else {
                deltaY = y
            }
        } else if (handle === "sw") {
            const a = -originalHeight / originalWidth;
            const b = 0
            const f = (x: number) => a * x + b;
            const y = f(deltaX);
            if (y > deltaY) {
                deltaX = (deltaY - b) / a;
            } else {
                deltaY = y
            }
        } else if (handle === "nw") {
            const a = originalHeight / originalWidth;
            const b = 0
            const f = (x: number) => a * x + b;
            const y = f(deltaX);
            if (y < deltaY) {
                deltaX = (deltaY - b) / a;
            } else {
                deltaY = y
            }
        } else if (handle === "ne") {
            const a = -originalHeight / originalWidth;
            const b = 0
            const f = (x: number) => a * x + b;
            const y = f(deltaX);
            if (y < deltaY) {
                deltaX = (deltaY - b) / a;
            } else {
                deltaY = y
            }
        }
    }

    let newX = 0;
    let newY = 0;
    let newWidth = 0;
    let newHeight = 0;
    if (handle === "nw") {
        newX = originalX - deltaX;
        newY = originalY - deltaY;
        newWidth = originalWidth + deltaX * (centered ? 2 : 1);
        newHeight = originalHeight + deltaY * (centered ? 2 : 1);
    } else if (handle === "ne") {
        newX = originalX + (deltaX * (centered ? 1 : 0));
        newY = originalY - deltaY;
        newWidth = originalWidth - deltaX * (centered ? 2 : 1);
        newHeight = originalHeight + deltaY * (centered ? 2 : 1);
    } else if (handle === "se") {
        newX = originalX + deltaX * (centered ? 1 : 0);
        newY = originalY + deltaY * (centered ? 1 : 0);
        newWidth = originalWidth - deltaX * (centered ? 2 : 1);
        newHeight = originalHeight - deltaY * (centered ? 2 : 1);
    } else if (handle === "sw") {
        newX = originalX - deltaX;
        newY = originalY + deltaY * (centered ? 1 : 0);
        newWidth = originalWidth + deltaX * (centered ? 2 : 1);
        newHeight = originalHeight - deltaY * (centered ? 2 : 1);
    } else if (handle === "n") {
        newY = originalY - deltaY;
        newHeight = originalHeight + deltaY * (centered ? 2 : 1);
    } else if (handle === "e") {
        newWidth = originalWidth - deltaX * (centered ? 2 : 1);
        newX = originalX + deltaX * (centered ? 1 : 0);
    } else if (handle === "s") {
        newHeight = originalHeight - deltaY * (centered ? 2 : 1);
        newY = originalY + deltaY * (centered ? 1 : 0);
    } else if (handle === "w") {
        newWidth = originalWidth + deltaX * (centered ? 2 : 1);
        newX = originalX - deltaX;
    } else {
        console.error("Invalid handle type");
    }

    const factorWidth = newWidth / originalWidth
    const factorHeight = newHeight / originalHeight
    const factorX = newX / originalX
    const factorY = newY / originalY

    components.update(components => {
        return components.map(c => {
            if (c.id === draggedComponent.id) {
                c.position.x = newX
                c.position.y = newY
                c.position.width = newWidth
                c.position.height = newHeight
            } else {
                const originalPosition = componentsBeforeScale!.find(component => component.id === c.id)!.position;
                c.position.x = originalPosition.x * factorX
                c.position.y = originalPosition.y * factorY
                c.position.width = originalPosition.width * factorWidth
                c.position.height = originalPosition.height * factorHeight
            }
            return c
        })
    })

    selectedComponents.update(selected => {
        const ids = selected.map(c => c.id)
        return get(components).filter(c => ids.includes(c.id))
    })

    usedSnappingLines.set(usedSnappingLinesInProcess);
}

export function stopScale() {
    componentsBeforeScale = null;
    mouseBeforeScale = null;
    usedSnappingLines.set(null);
}