import type {Component} from "./component";
import type {HandleType} from "./handle";
import {get} from "svelte/store";
import {selectedComponents} from "./selection";
import {canvasScale, components, frames} from "./state";
import {usedSnappingLines} from "./move";
import type {Position} from "$lib/canvas/position";

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

    const naiveResult = calculateScaling(
        originalX,
        originalY,
        originalWidth,
        originalHeight,
        centered,
        handle,
        mouseX - mouseBeforeScale!.x,
        mouseY - mouseBeforeScale!.y,
        false
    )

    const selectedIds = get(selectedComponents).map(c => c.id);

    let usedSnappingLinesInProcess = null
    const frame = get(frames).find(f => f.id === draggedComponent.frame);

    let isXSnap = false;
    let isYSnap = false;

    let {
        newX: mouseXAfterProportional,
        newY: mouseYAfterProportional
    } = proportional ? calculateProportional(originalPosition, handle, mouseX, mouseY) : {newX: mouseX, newY: mouseY};
    const diagonalThroughHandle = calculateDiagonalThroughHandle(originalPosition, handle);
    const diagonalThroughHandleFunction = (x: number) =>
        diagonalThroughHandle.slope * (x + diagonalThroughHandle.shift) + diagonalThroughHandle.offset;
    const diagonalThroughHandleFunctionInverse = (y: number) =>
        (y - diagonalThroughHandle.offset) / diagonalThroughHandle.slope - diagonalThroughHandle.shift;


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

        if (isHandleWest || canChangeWest) {
            const nearestXSnap = snappingLines.x.sort((a, b) => {
                if (proportional) {
                    const da = Math.abs(mouseXAfterProportional - a);
                    const db = Math.abs(mouseXAfterProportional - b);
                    return da - db;
                }
                return Math.abs(a - naiveResult.scaledX) - Math.abs(b - naiveResult.scaledX);
            })[0]
            const currentResultForX = proportional
                ? calculateScaling(
                    originalX,
                    originalY,
                    originalWidth,
                    originalHeight,
                    centered,
                    handle,
                    mouseXAfterProportional - mouseBeforeScale!.x,
                    mouseYAfterProportional - mouseBeforeScale!.y,
                    false,
                )
                : naiveResult;
            const nearestXSnapDistance = nearestXSnap - currentResultForX.scaledX
            const allowSnap = proportional
                ? Math.abs(mouseXAfterProportional - nearestXSnap) <= SNAP_DISTANCE
                : Math.abs(nearestXSnapDistance) <= SNAP_DISTANCE
            if (allowSnap) {
                mouseXAfterProportional += nearestXSnapDistance * (isHandleWest ? 1 : -1)
                if (proportional) {
                    mouseYAfterProportional = diagonalThroughHandleFunction(mouseXAfterProportional)
                }
                isXSnap = true
                usedSnappingLinesInProcess.x.push(nearestXSnap);
            }
        }
        if ((isHandleEast || canChangeEast) && !isXSnap) {
            const nearestXSnap = snappingLines.x.sort((a, b) => {
                if (proportional) {
                    const da = Math.abs(mouseXAfterProportional - a);
                    const db = Math.abs(mouseXAfterProportional - b);
                    return da - db;
                }
                return Math.abs(a - naiveResult.scaledX - naiveResult.scaledWidth) - Math.abs(b - naiveResult.scaledX - naiveResult.scaledWidth);
            })[0]
            const currentResultForX = proportional
                ? calculateScaling(
                    originalX,
                    originalY,
                    originalWidth,
                    originalHeight,
                    centered,
                    handle,
                    mouseXAfterProportional - mouseBeforeScale!.x,
                    mouseYAfterProportional - mouseBeforeScale!.y,
                    false,
                )
                : naiveResult;
            const nearestXSnapDistance = nearestXSnap - (currentResultForX.scaledX + currentResultForX.scaledWidth)
            const allowSnap = proportional
                ? Math.abs(mouseXAfterProportional - nearestXSnap) <= SNAP_DISTANCE
                : Math.abs(nearestXSnapDistance) <= SNAP_DISTANCE
            if (allowSnap) {
                mouseXAfterProportional += nearestXSnapDistance * (isHandleEast ? 1 : -1)
                if (proportional) {
                    mouseYAfterProportional = diagonalThroughHandleFunction(mouseXAfterProportional)
                }
                usedSnappingLinesInProcess.x.push(nearestXSnap);
            }
        }

        if (isHandleNorth || canChangeNorth) {
            const nearestYSnap = snappingLines.y.sort((a, b) => {
                if (proportional) {
                    const da = Math.abs(mouseYAfterProportional - a);
                    const db = Math.abs(mouseYAfterProportional - b);
                    return da - db;
                }
                return Math.abs(a - naiveResult.scaledY) - Math.abs(b - naiveResult.scaledY);
            })[0]
            const currentResultForY = proportional
                ? calculateScaling(
                    originalX,
                    originalY,
                    originalWidth,
                    originalHeight,
                    centered,
                    handle,
                    mouseXAfterProportional - mouseBeforeScale!.x,
                    mouseYAfterProportional - mouseBeforeScale!.y,
                    false,
                )
                : naiveResult;
            const nearestYSnapDistance = nearestYSnap - currentResultForY.scaledY
            const allowSnap = proportional
                ? Math.abs(mouseYAfterProportional - nearestYSnap) <= SNAP_DISTANCE
                : Math.abs(nearestYSnapDistance) <= SNAP_DISTANCE
            if (allowSnap) {
                mouseYAfterProportional += nearestYSnapDistance * (isHandleNorth ? 1 : -1)
                if (proportional) {
                    mouseXAfterProportional = diagonalThroughHandleFunctionInverse(mouseYAfterProportional)
                }
                usedSnappingLinesInProcess.y.push(nearestYSnap);
                isYSnap = true;
            }
        }
        if ((isHandleSouth || canChangeSouth) && !isYSnap) {
            const nearestYSnap = snappingLines.y.sort((a, b) => {
                if (proportional) {
                    const da = Math.abs(mouseYAfterProportional - a);
                    const db = Math.abs(mouseYAfterProportional - b);
                    return da - db;
                }
                return Math.abs(a - naiveResult.scaledY - naiveResult.scaledHeight) - Math.abs(b - naiveResult.scaledY - naiveResult.scaledHeight);
            })[0]
            const currentResultForY = proportional
                ? calculateScaling(
                    originalX,
                    originalY,
                    originalWidth,
                    originalHeight,
                    centered,
                    handle,
                    mouseXAfterProportional - mouseBeforeScale!.x,
                    mouseYAfterProportional - mouseBeforeScale!.y,
                    false,
                )
                : naiveResult;
            const nearestYSnapDistance = nearestYSnap - (currentResultForY.scaledY + currentResultForY.scaledHeight)
            const allowSnap = proportional
                ? Math.abs(mouseYAfterProportional - nearestYSnap) <= SNAP_DISTANCE
                : Math.abs(nearestYSnapDistance) <= SNAP_DISTANCE
            if (allowSnap) {
                mouseYAfterProportional += nearestYSnapDistance * (isHandleSouth ? 1 : -1)
                if (proportional) {
                    mouseXAfterProportional = diagonalThroughHandleFunctionInverse(mouseYAfterProportional)
                }
                usedSnappingLinesInProcess.y.push(nearestYSnap);
            }
        }
    }

    let deltaX = mouseXAfterProportional - mouseBeforeScale!.x;
    let deltaY = mouseYAfterProportional - mouseBeforeScale!.y;

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
    // Normalize any negative width/height for all currently selected components
    const selectedIds = get(selectedComponents).map(c => c.id);
    components.update(list => list.map(c => {
        if (!selectedIds.includes(c.id)) return c;
        const p = c.position;
        if (p.width < 0) {
            p.x += p.width;
            p.width = -p.width;
        }
        if (p.height < 0) {
            p.y += p.height;
            p.height = -p.height;
        }
        return c;
    }))

    // Re-sync selected components with the normalized values
    selectedComponents.update(selected => {
        const ids = selected.map(c => c.id)
        return get(components).filter(c => ids.includes(c.id))
    })

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

function calculateDiagonalThroughHandle(position: Position, handle: HandleType) {
    const ySign = handle.includes("n") ? -1 : 1;
    const slopeSign = handle.includes("n") !== handle.includes("w") ? -1 : 1;

    const safeWidth = position.width === 0 ? 1e-6 : position.width;
    const slope = slopeSign * position.height / safeWidth;
    const offset = ySign === 1 ? position.y + position.height : position.y;
    const shift = handle.includes("w") ? -position.x : -(position.x + position.width);

    return { slope, offset, shift };
}


function calculateProportional(position: Position, handle: HandleType, inputX: number, inputY: number): { newX: number, newY: number } {
    const { slope, offset, shift } = calculateDiagonalThroughHandle(position, handle)
    const linearFunction = (x: number) => slope * (x + shift) + offset
    const inverseLinearFunction = (y: number) => (y - offset) / slope - shift

    const yFromX = linearFunction(inputX)
    const xFromY = inverseLinearFunction(inputY)

    const dy = Math.abs(yFromX - inputY)
    const dx = Math.abs(xFromY - inputX)

    if (dy <= dx) {
        return { newX: inputX, newY: yFromX }
    } else {
        return { newX: xFromY, newY: inputY }
    }
}
