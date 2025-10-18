import type {HandleType} from "./script";

export function calculateScaling(
    x: number,
    y: number,
    width: number,
    height: number,
    centered: boolean,
    handle: HandleType,
    handleX: number,
    handleY: number,
    normalize: boolean = false,
): { scaledX: number; scaledY: number; scaledWidth: number; scaledHeight: number } {
    let scaledX = x;
    let scaledY = y;
    let scaledWidth = width;
    let scaledHeight = height;
    if (handle === "nw") {
        scaledX = x - handleX;
        scaledY = y - handleY;
        scaledWidth = width + handleX * (centered ? 2 : 1);
        scaledHeight = height + handleY * (centered ? 2 : 1);
    } else if (handle === "ne") {
        scaledX = x + (handleX * (centered ? 1 : 0));
        scaledY = y - handleY;
        scaledWidth = width - handleX * (centered ? 2 : 1);
        scaledHeight = height + handleY * (centered ? 2 : 1);
    } else if (handle === "se") {
        scaledX = x + handleX * (centered ? 1 : 0);
        scaledY = y + handleY * (centered ? 1 : 0);
        scaledWidth = width - handleX * (centered ? 2 : 1);
        scaledHeight = height - handleY * (centered ? 2 : 1);
    } else if (handle === "sw") {
        scaledX = x - handleX;
        scaledY = y + handleY * (centered ? 1 : 0);
        scaledWidth = width + handleX * (centered ? 2 : 1);
        scaledHeight = height - handleY * (centered ? 2 : 1);
    } else if (handle === "n") {
        scaledY = y - handleY;
        scaledHeight = height + handleY * (centered ? 2 : 1);
    } else if (handle === "e") {
        scaledWidth = width - handleX * (centered ? 2 : 1);
        scaledX = x + handleX * (centered ? 1 : 0);
    } else if (handle === "s") {
        scaledHeight = height - handleY * (centered ? 2 : 1);
        scaledY = y + handleY * (centered ? 1 : 0);
    } else if (handle === "w") {
        scaledWidth = width + handleX * (centered ? 2 : 1);
        scaledX = x - handleX
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