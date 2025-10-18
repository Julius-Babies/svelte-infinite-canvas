export type HandleType = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export interface Handle {
    type: HandleType,
    x: number,
    y: number,
    cursor: "nw-resize" | "n-resize" | "ne-resize" | "e-resize" | "se-resize" | "s-resize" | "sw-resize" | "w-resize"
}

const HANDLE_SIZE_PX = 16;

export function getHandles(zoom: number, width: number, height: number): { handles: Handle[], handleSize: number } {
    const flipX = width < 0 ? -1 : 1;
    const flipY = height < 0 ? -1 : 1;
    const handleSize = HANDLE_SIZE_PX / zoom;

    const absW = Math.abs(width);
    const absH = Math.abs(height);

    return {
        handleSize: handleSize,
        handles: [
            {
                type: "nw",
                x: (flipX === 1 ? 0 : absW) - handleSize / 2,
                y: (flipY === 1 ? 0 : absH) - handleSize / 2,
                cursor: "nw-resize"
            },
            {
                type: "n",
                x: absW / 2 - handleSize / 2,
                y: (flipY === 1 ? 0 : absH) - handleSize / 2,
                cursor: "n-resize"
            },
            {
                type: "ne",
                x: (flipX === 1 ? absW : 0) - handleSize / 2,
                y: (flipY === 1 ? 0 : absH) - handleSize / 2,
                cursor: "ne-resize"
            },
            {
                type: "w",
                x: (flipX === 1 ? 0 : absW) - handleSize / 2,
                y: absH / 2 - handleSize / 2,
                cursor: "w-resize"
            },
            {
                type: "e",
                x: (flipX === 1 ? absW : 0) - handleSize / 2,
                y: absH / 2 - handleSize / 2,
                cursor: "e-resize"
            },
            {
                type: "sw",
                x: (flipX === 1 ? 0 : absW) - handleSize / 2,
                y: (flipY === 1 ? absH : 0) - handleSize / 2,
                cursor: "sw-resize"
            },
            {
                type: "s",
                x: absW / 2 - handleSize / 2,
                y: (flipY === 1 ? absH : 0) - handleSize / 2,
                cursor: "s-resize"
            },
            {
                type: "se",
                x: (flipX === 1 ? absW : 0) - handleSize / 2,
                y: (flipY === 1 ? absH : 0) - handleSize / 2,
                cursor: "se-resize"
            }
        ]
    }
}
