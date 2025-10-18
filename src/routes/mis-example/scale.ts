import type {Component} from "./component";
import type {HandleType} from "./handle";
import {get} from "svelte/store";
import {selectedComponents} from "./selection";
import {canvasScale, components, frames} from "./state";
import {usedSnappingLines} from "./move";

let componentsBeforeScale: Component[] | null = null;
let mouseBeforeScale: {x: number; y: number} | null = null;
export function setMouseBeforeScale(x: number, y: number) {
    mouseBeforeScale = {x, y};
}

export function scale(draggedComponent: Component, handle: HandleType, mouseX: number, mouseY: number, snap: boolean, centered: boolean, proportional: boolean) {
    if (!componentsBeforeScale) {
        componentsBeforeScale = get(selectedComponents).map(c => ({ ...c, position: { ...c.position } }));
    }

    const originalPosition = componentsBeforeScale!.find(component => component.id === draggedComponent.id)!.position;
    const originalWidth = originalPosition.width;
    const originalHeight = originalPosition.height;
    const originalX = originalPosition.x;
    const originalY = originalPosition.y;

    console.log(originalPosition)

    const naiveResultNormalized = calculateScaling(
        originalX,
        originalY,
        originalWidth,
        originalHeight,
        centered,
        handle,
        mouseX - mouseBeforeScale!.x,
        mouseY - mouseBeforeScale!.y,
        true
    )

    const selectedIds = get(selectedComponents).map(c => c.id);

    let usedSnappingLinesInProcess = null
    const frame = get(frames).find(f => f.id === draggedComponent.frame);
    if (snap && frame) {

        const SNAP_DISTANCE = 16/get(canvasScale);

        usedSnappingLinesInProcess = {
            frameId: frame.id,
            x: [] as number[],
            y: [] as number[],
        }
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

        let isXSnap = false;
        let isYSnap = false;

        if (isHandleWest || canChangeWest) {
            const nearestXSnap = snappingLines.x.sort((a, b) => Math.abs(a - naiveResultNormalized.scaledX) - Math.abs(b - naiveResultNormalized.scaledX))[0]
            const nearestXSnapDistance = nearestXSnap - naiveResultNormalized.scaledX
            if (Math.abs(nearestXSnapDistance) <= SNAP_DISTANCE) {
                mouseX += nearestXSnapDistance * (isHandleWest ? 1 : -1)
                isXSnap = true
                usedSnappingLinesInProcess.x.push(nearestXSnap);
            }
        }
        if ((isHandleEast || canChangeEast) && !isXSnap) {
            const nearestXSnap = snappingLines.x.sort((a, b) => Math.abs(a - naiveResultNormalized.scaledX - naiveResultNormalized.scaledWidth) - Math.abs(b - naiveResultNormalized.scaledX - naiveResultNormalized.scaledWidth))[0]
            const nearestXSnapDistance = nearestXSnap - naiveResultNormalized.scaledX - naiveResultNormalized.scaledWidth
            if (Math.abs(nearestXSnapDistance) <= SNAP_DISTANCE) {
                mouseX += nearestXSnapDistance * (isHandleEast ? 1 : -1)
                usedSnappingLinesInProcess.x.push(nearestXSnap);
            }
        }

        if (isHandleNorth || canChangeNorth) {
            const nearestYSnap = snappingLines.y.sort((a, b) => Math.abs(a - naiveResultNormalized.scaledY) - Math.abs(b - naiveResultNormalized.scaledY))[0]
            const nearestYSnapDistance = nearestYSnap - naiveResultNormalized.scaledY
            if (Math.abs(nearestYSnapDistance) <= SNAP_DISTANCE) {
                mouseY += nearestYSnapDistance * (isHandleNorth ? 1 : -1)
                usedSnappingLinesInProcess.y.push(nearestYSnap);
                isYSnap = true;
            }
        }
        if ((isHandleSouth || canChangeSouth) && !isYSnap) {
            const nearestYSnap = snappingLines.y.sort((a, b) => Math.abs(a - naiveResultNormalized.scaledY - naiveResultNormalized.scaledHeight) - Math.abs(b - naiveResultNormalized.scaledY - naiveResultNormalized.scaledHeight))[0]
            const nearestYSnapDistance = nearestYSnap - naiveResultNormalized.scaledY - naiveResultNormalized.scaledHeight
            if (Math.abs(nearestYSnapDistance) <= SNAP_DISTANCE) {
                mouseY += nearestYSnapDistance * (isHandleSouth ? 1 : -1)
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

    let deltaX = mouseX - mouseBeforeScale!.x;
    let deltaY = mouseY - mouseBeforeScale!.y;

    let {
        scaledX: newX,
        scaledY: newY,
        scaledWidth: newWidth,
        scaledHeight: newHeight
    } = calculateScaling(
        originalX,
        originalY,
        originalWidth,
        originalHeight,
        centered,
        handle,
        deltaX,
        deltaY,
        false,
    )

    const factorWidth = newWidth / originalWidth
    const factorHeight = newHeight / originalHeight
    const factorX = newX / originalX
    const factorY = newY / originalY

    components.update(components => {
        return components.map(c => {
            if (!selectedIds.includes(c.id)) return c;
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
    console.log("stop scale")
    componentsBeforeScale = null;
    mouseBeforeScale = null;
    usedSnappingLines.set(null);
}

function calculateScaling(
    x: number,
    y: number,
    width: number,
    height: number,
    centered: boolean,
    handle: HandleType,
    deltaX: number,
    deltaY: number,
    normalize: boolean = false,
): { scaledX: number; scaledY: number; scaledWidth: number; scaledHeight: number } {
    let scaledX = x;
    let scaledY = y;
    let scaledWidth = width;
    let scaledHeight = height;
    if (handle === "nw") {
        scaledX = x + deltaX;
        scaledY = y + deltaY;
        scaledWidth = width - deltaX * (centered ? 2 : 1);
        scaledHeight = height - deltaY * (centered ? 2 : 1);
    } else if (handle === "ne") {
        scaledX = x - (deltaX * (centered ? 1 : 0));
        scaledY = y + deltaY;
        scaledWidth = width + deltaX * (centered ? 2 : 1);
        scaledHeight = height - deltaY * (centered ? 2 : 1);
    } else if (handle === "se") {
        scaledX = x - deltaX * (centered ? 1 : 0);
        scaledY = y - deltaY * (centered ? 1 : 0);
        scaledWidth = width + deltaX * (centered ? 2 : 1);
        scaledHeight = height + deltaY * (centered ? 2 : 1);
    } else if (handle === "sw") {
        scaledX = x + deltaX;
        scaledY = y - deltaY * (centered ? 1 : 0);
        scaledWidth = width - deltaX * (centered ? 2 : 1);
        scaledHeight = height + deltaY * (centered ? 2 : 1);
    } else if (handle === "n") {
        scaledY = y + deltaY;
        scaledHeight = height - deltaY * (centered ? 2 : 1);
    } else if (handle === "e") {
        scaledWidth = width + deltaX * (centered ? 2 : 1);
        scaledX = x - deltaX * (centered ? 1 : 0);
    } else if (handle === "s") {
        scaledHeight = height + deltaY * (centered ? 2 : 1);
        scaledY = y - deltaY * (centered ? 1 : 0);
    } else if (handle === "w") {
        scaledWidth = width - deltaX * (centered ? 2 : 1);
        scaledX = x + deltaX;
    } else {
        console.error("Invalid handle type");
    }

    if (normalize) {
        if (scaledWidth < 0) {
            scaledX += scaledWidth;
            scaledWidth = Math.abs(scaledWidth);
        }
        if (scaledHeight < 0) {
            scaledY += scaledHeight;
            scaledHeight = Math.abs(scaledHeight);
        }
    }

    return { scaledX, scaledY, scaledWidth, scaledHeight };
}