import type {Component} from "./component";
import {selectedComponents} from "./selection";
import {get, writable} from "svelte/store";
import {canvasScale, components, frames} from "./state";
import {getOverlap} from "./util";

let componentsBeforeMove: Component[] | null = null;
let mouseBeforeMove: {x: number; y: number} | null = null;
export let usedSnappingLines = writable<{
    frameId: string,
    x: number[],
    y: number[]
} |null>(null)
export function setMouseBeforeMove(x: number, y: number) {
    mouseBeforeMove = {x, y};
}

export function move(draggedComponent: Component, mouseX: number, mouseY: number, snap: boolean) {
    if (!get(selectedComponents).includes(draggedComponent)) selectedComponents.set([draggedComponent]);
    if (!componentsBeforeMove) {
        componentsBeforeMove = Object.create([...get(selectedComponents)]);
    }

    const boundingRect = {
        x: Math.min(...componentsBeforeMove!.map(r => r.position.x)),
        y: Math.min(...componentsBeforeMove!.map(r => r.position.y)),
        width: Math.max(...componentsBeforeMove!.map(r => r.position.x + r.position.width)) - Math.min(...componentsBeforeMove!.map(r => r.position.x)),
        height: Math.max(...componentsBeforeMove!.map(r => r.position.y + r.position.height)) - Math.min(...componentsBeforeMove!.map(r => r.position.y))
    }

    let usedSnappingLinesInProcess = null

    const frame = get(frames).find(f => f.id === draggedComponent.frame);
    if (frame && snap) {
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

        const theoreticalNewPosition = {
            x: boundingRect.x + mouseX - mouseBeforeMove!.x,
            y: boundingRect.y + mouseY - mouseBeforeMove!.y
        }

        const SNAP_DISTANCE = 16/get(canvasScale);

        let isXSnapped = false;
        let isYSnapped = false;

        const originalPosition = componentsBeforeMove!.find(c => c.id === draggedComponent.id)?.position!;

        const round3 = (v: number) => Math.round(v * 1000) / 1000;
        if (!isXSnapped) { // Left edge
            const nearestSnapX = snappingLines.x.sort((a, b) => Math.abs(a - theoreticalNewPosition.x) - Math.abs(b - theoreticalNewPosition.x))[0]
            const nearestSnapXDistance = nearestSnapX - theoreticalNewPosition.x
            if (Math.abs(nearestSnapXDistance) <= SNAP_DISTANCE) {
                mouseX += nearestSnapXDistance;
                usedSnappingLinesInProcess.x.push(nearestSnapX);

                const snappingLineWithSameCenter = snappingLines.x.find(x => round3(x) === round3(originalPosition.x + mouseX - mouseBeforeMove!.x + draggedComponent.position.width / 2));
                if (snappingLineWithSameCenter) usedSnappingLinesInProcess.x.push(snappingLineWithSameCenter);

                const snappingLineWithSameWidth = snappingLines.x.find(x => round3(x) === round3(originalPosition.x + mouseX - mouseBeforeMove!.x + draggedComponent.position.width));
                if (snappingLineWithSameWidth) usedSnappingLinesInProcess.x.push(snappingLineWithSameWidth);

                isXSnapped = true;
            }
        }
        if (!isXSnapped) { // Right edge
            const nearestSnapXWidth = snappingLines.x.sort((a, b) => Math.abs(a - (theoreticalNewPosition.x + boundingRect.width)) - Math.abs(b - (theoreticalNewPosition.x + boundingRect.width)))[0]
            const nearestSnapXWidthDistance = nearestSnapXWidth - (theoreticalNewPosition.x + boundingRect.width)
            if (Math.abs(nearestSnapXWidthDistance) <= SNAP_DISTANCE) {
                mouseX += nearestSnapXWidthDistance;
                usedSnappingLinesInProcess.x.push(nearestSnapXWidth);

                const snappingLineWithSameX = snappingLines.x.find(x => round3(x) === round3(originalPosition.x + mouseX - mouseBeforeMove!.x));
                if (snappingLineWithSameX) usedSnappingLinesInProcess.x.push(snappingLineWithSameX);

                const snappingLineWithSameCenter = snappingLines.x.find(x => round3(x) === round3(originalPosition.x + mouseX - mouseBeforeMove!.x + draggedComponent.position.width / 2));
                if (snappingLineWithSameCenter) usedSnappingLinesInProcess.x.push(snappingLineWithSameCenter);

                isXSnapped = true;
            }
        }
        if (!isXSnapped) { // Center
            const nearestSnapXCenter = snappingLines.x.sort((a, b) => Math.abs(a - (theoreticalNewPosition.x + boundingRect.width / 2)) - Math.abs(b - (theoreticalNewPosition.x + boundingRect.width / 2)))[0]
            const nearestSnapXCenterDistance = nearestSnapXCenter - (theoreticalNewPosition.x + boundingRect.width / 2)
            if (Math.abs(nearestSnapXCenterDistance) <= SNAP_DISTANCE) {
                mouseX += nearestSnapXCenterDistance;
                usedSnappingLinesInProcess.x.push(nearestSnapXCenter);

                const snappingLineWithSameX = snappingLines.x.find(x => round3(x) === round3(originalPosition.x + mouseX - mouseBeforeMove!.x));
                if (snappingLineWithSameX) usedSnappingLinesInProcess.x.push(snappingLineWithSameX);

                const snappingLineWithSameWidth = snappingLines.x.find(x => round3(x) === round3(originalPosition.x + mouseX - mouseBeforeMove!.x + draggedComponent.position.width));
                if (snappingLineWithSameWidth) usedSnappingLinesInProcess.x.push(snappingLineWithSameWidth);
            }
        }

        if (!isYSnapped) { // Top edge
            const nearestSnapY = snappingLines.y.sort((a, b) => Math.abs(a - theoreticalNewPosition.y) - Math.abs(b - theoreticalNewPosition.y))[0];
            const nearestSnapYDistance = nearestSnapY - theoreticalNewPosition.y;
            if (Math.abs(nearestSnapYDistance) <= SNAP_DISTANCE) {
                mouseY += nearestSnapYDistance;
                usedSnappingLinesInProcess.y.push(nearestSnapY);

                const snappingLineWithSameCenter = snappingLines.y.find(y => round3(y) === round3(originalPosition.y + mouseY - mouseBeforeMove!.y + draggedComponent.position.height / 2));
                if (snappingLineWithSameCenter) usedSnappingLinesInProcess.y.push(snappingLineWithSameCenter);

                const snappingLineWithSameHeight = snappingLines.y.find(y => round3(y) === round3(originalPosition.y + mouseY - mouseBeforeMove!.y + draggedComponent.position.height));
                if (snappingLineWithSameHeight) usedSnappingLinesInProcess.y.push(snappingLineWithSameHeight);

                isYSnapped = true;
            }
        }
        if (!isYSnapped) { // Bottom edge
            const nearestSnapYHeight = snappingLines.y.sort((a, b) => Math.abs(a - (theoreticalNewPosition.y + boundingRect.height)) - Math.abs(b - (theoreticalNewPosition.y + boundingRect.height)))[0];
            const nearestSnapYHeightDistance = nearestSnapYHeight - (theoreticalNewPosition.y + boundingRect.height);
            if (Math.abs(nearestSnapYHeightDistance) <= SNAP_DISTANCE) {
                mouseY += nearestSnapYHeightDistance;
                usedSnappingLinesInProcess.y.push(nearestSnapYHeight);

                const snappingLineWithSameY = snappingLines.y.find(y => round3(y) === round3(originalPosition.y + mouseY - mouseBeforeMove!.y));
                if (snappingLineWithSameY) usedSnappingLinesInProcess.y.push(snappingLineWithSameY);

                const snappingLineWithSameCenter = snappingLines.y.find(y => round3(y) === round3(originalPosition.y + mouseY - mouseBeforeMove!.y + draggedComponent.position.height / 2));
                if (snappingLineWithSameCenter) usedSnappingLinesInProcess.y.push(snappingLineWithSameCenter);

                isYSnapped = true;
            }
        }
        if (!isYSnapped) { // Center
            const nearestSnapYCenter = snappingLines.y.sort((a, b) => Math.abs(a - (theoreticalNewPosition.y + boundingRect.height / 2)) - Math.abs(b - (theoreticalNewPosition.y + boundingRect.height / 2)))[0];
            const nearestSnapYCenterDistance = nearestSnapYCenter - (theoreticalNewPosition.y + boundingRect.height / 2);
            if (Math.abs(nearestSnapYCenterDistance) <= SNAP_DISTANCE) {
                mouseY += nearestSnapYCenterDistance;
                usedSnappingLinesInProcess.y.push(nearestSnapYCenter);

                const snappingLineWithSameY = snappingLines.y.find(y => round3(y) === round3(originalPosition.y + mouseY - mouseBeforeMove!.y));
                if (snappingLineWithSameY) usedSnappingLinesInProcess.y.push(snappingLineWithSameY);

                const snappingLineWithSameHeight = snappingLines.y.find(y => round3(y) === round3(originalPosition.y + mouseY - mouseBeforeMove!.y + draggedComponent.position.height));
                if (snappingLineWithSameHeight) usedSnappingLinesInProcess.y.push(snappingLineWithSameHeight);
            }
        }
    }

    let mouseXDelta = mouseX - mouseBeforeMove!.x;
    let mouseYDelta = mouseY - mouseBeforeMove!.y;

    components.update(components => {
        return components.map(component => {
            if (!get(selectedComponents).includes(component)) return component;
            const originalPosition = componentsBeforeMove?.find(c => c.id === component.id)?.position
            if (!originalPosition) throw new Error("Component not found");
            const newPosition = {
                ...component.position,
                x: originalPosition.x + mouseXDelta,
                y: originalPosition.y + mouseYDelta,
            }

            let frame = null;

            get(frames).forEach(f => {
                if (getOverlap(newPosition, f.position)) {
                    frame = f.id;
                    return;
                }
            })

            return {
                ...component,
                frame: frame,
                position: newPosition
            }
        });
    })

    selectedComponents.update(selected => {
        const ids = selected.map(c => c.id)
        return get(components).filter(c => ids.includes(c.id))
    })

    usedSnappingLines.set(usedSnappingLinesInProcess);
}

export function stopMove() {
    componentsBeforeMove = null;
    mouseBeforeMove = null;
    usedSnappingLines.set(null);
}