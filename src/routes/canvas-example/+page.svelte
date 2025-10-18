<script lang="ts">
    import Canvas from "$lib/canvas/Canvas.svelte";
    import type {HandleType, Rectangle as RectangleType} from "./script";
    import Rectangle from "./Rectangle.svelte";
    import {calculateScaling} from "./util";

    let zoom = $state(1);

    let rectangles: RectangleType[] = $state([
        {
            "id": 0,
            "x": 35,
            "y": 55,
            "width": 100,
            "height": 300,
            "color": "#ff00ff",
            "isFlippedHorizontally": false,
            "isFlippedVertically": false
        },
        {
            "id": 1,
            "x": 293,
            "y": 150,
            "width": 499,
            "height": 240,
            "color": "#9f8e23",
            "isFlippedHorizontally": false,
            "isFlippedVertically": false
        }
    ]);

    let selectedRectangles: RectangleType[] = $state([]);

    let snappingLines = $derived({
        x: [
            0,
            1920/2,
            1920,
            ...rectangles.filter(r => !selectedRectangles.includes(r)).flatMap(r => [
                r.x,
                r.x + r.width / 2,
                r.x + r.width
            ])
        ],
        y: [
            0,
            1080/2,
            1080,
            ...rectangles.filter(r => !selectedRectangles.includes(r)).flatMap(r => [
                r.y,
                r.y + r.height / 2,
                r.y + r.height
            ])
        ]
    })
    let usedSnappingLines = $state({
        x: [] as number[],
        y: [] as number[]
    })

    function select(rectangle: RectangleType, withShift: boolean) {
        if (withShift) {
            if (selectedRectangles.includes(rectangle)) {
                selectedRectangles = selectedRectangles.filter(r => r !== rectangle);
            } else {
                selectedRectangles = [...selectedRectangles, rectangle];
            }
        } else {
            selectedRectangles = [rectangle];
        }
    }

    let rectanglesBeforeMove: RectangleType[] | undefined;
    function onMove(rectangle: RectangleType, mouseX: number, mouseY: number, withSnap: boolean) {
        if (!selectedRectangles.includes(rectangle)) selectedRectangles = [rectangle];
        if (!rectanglesBeforeMove) rectanglesBeforeMove = Object.create([...selectedRectangles.map(r => ({...r}))])

        const completeRect = {
            x: Math.min(...rectanglesBeforeMove!.map(r => r.x)),
            y: Math.min(...rectanglesBeforeMove!.map(r => r.y)),
            width: Math.max(...rectanglesBeforeMove!.map(r => r.x + r.width)) - Math.min(...rectanglesBeforeMove!.map(r => r.x)),
            height: Math.max(...rectanglesBeforeMove!.map(r => r.y + r.height)) - Math.min(...rectanglesBeforeMove!.map(r => r.y))
        }

        const usedSnappingLinesInProcess = {
            x: [] as number[],
            y: [] as number[]
        }
        if (withSnap) {
            const theoreticalNewPosition = {
                x: - mouseX + completeRect.x,
                y: - mouseY + completeRect.y,
            }

            const SNAP_DISTANCE = 16/zoom;

            let isXSnapped = false;
            let isYSnapped = false;

            if (!isXSnapped) {
                const nearestSnapX = snappingLines.x.sort((a, b) => Math.abs(a - theoreticalNewPosition.x) - Math.abs(b - theoreticalNewPosition.x))[0]
                const nearestSnapXDistance = Math.abs(nearestSnapX - theoreticalNewPosition.x)
                if (nearestSnapXDistance <= SNAP_DISTANCE) {
                    mouseX = - (nearestSnapX - completeRect.x);
                    usedSnappingLinesInProcess.x.push(nearestSnapX);
                    isXSnapped = true;
                }
            }
            if (!isXSnapped) {
                const nearestSnapXWidth = snappingLines.x.sort((a, b) => Math.abs(a - (theoreticalNewPosition.x + completeRect.width)) - Math.abs(b - (theoreticalNewPosition.x + completeRect.width)))[0]
                const nearestSnapXWidthDistance = Math.abs(nearestSnapXWidth - (theoreticalNewPosition.x + completeRect.width))
                if (nearestSnapXWidthDistance <= SNAP_DISTANCE) {
                    mouseX = - (nearestSnapXWidth - completeRect.width - completeRect.x);
                    usedSnappingLinesInProcess.x.push(nearestSnapXWidth);
                    isXSnapped = true;
                }
            }
            if (!isXSnapped) {
                const nearestSnapXCenter = snappingLines.x.sort((a, b) => Math.abs(a - (theoreticalNewPosition.x + completeRect.width / 2)) - Math.abs(b - (theoreticalNewPosition.x + completeRect.width / 2)))[0]
                const nearestSnapXCenterDistance = Math.abs(nearestSnapXCenter - (theoreticalNewPosition.x + completeRect.width / 2))
                if (nearestSnapXCenterDistance <= SNAP_DISTANCE) {
                    mouseX = -(nearestSnapXCenter - completeRect.width / 2 - completeRect.x);
                    usedSnappingLinesInProcess.x.push(nearestSnapXCenter);
                    isXSnapped = true;
                }
            }

            if (!isYSnapped) {
                const nearestSnapY = snappingLines.y.sort((a, b) => Math.abs(a - theoreticalNewPosition.y) - Math.abs(b - theoreticalNewPosition.y))[0]
                const nearestSnapYDistance = Math.abs(nearestSnapY - theoreticalNewPosition.y)
                if (nearestSnapYDistance <= SNAP_DISTANCE) {
                    mouseY = - (nearestSnapY - completeRect.y);
                    usedSnappingLinesInProcess.y.push(nearestSnapY);
                    isYSnapped = true;
                }
            }
            if (!isYSnapped) {
                const nearestSnapYWidth = snappingLines.y.sort((a, b) => Math.abs(a - (theoreticalNewPosition.y + completeRect.height)) - Math.abs(b - (theoreticalNewPosition.y + completeRect.height)))[0]
                const nearestSnapYWidthDistance = Math.abs(nearestSnapYWidth - (theoreticalNewPosition.y + completeRect.height))
                if (nearestSnapYWidthDistance <= SNAP_DISTANCE) {
                    mouseY = -(nearestSnapYWidth - completeRect.height - completeRect.y);
                    usedSnappingLinesInProcess.y.push(nearestSnapYWidth);
                    isYSnapped = true;
                }
            }
            if (!isYSnapped) {
                const nearestSnapYCenter = snappingLines.y.sort((a, b) => Math.abs(a - (theoreticalNewPosition.y + completeRect.height / 2)) - Math.abs(b - (theoreticalNewPosition.y + completeRect.height / 2)))[0]
                const nearestSnapYCenterDistance = Math.abs(nearestSnapYCenter - (theoreticalNewPosition.y + completeRect.height / 2))
                if (nearestSnapYCenterDistance <= SNAP_DISTANCE) {
                    mouseY = -(nearestSnapYCenter - completeRect.height / 2 - completeRect.y);
                    usedSnappingLinesInProcess.y.push(nearestSnapYCenter);
                    isYSnapped = true;
                }
            }

        }
        usedSnappingLines = usedSnappingLinesInProcess;

        selectedRectangles.forEach(r => {
            const originalX = rectanglesBeforeMove!.find(rb => rb.id === r.id)!.x
            const originalY = rectanglesBeforeMove!.find(rb => rb.id === r.id)!.y
            r.x = - mouseX + originalX;
            r.y = - mouseY + originalY;
        })
    }

    function onMoveFinished() {
        rectanglesBeforeMove = undefined;
        usedSnappingLines = {
            x: [],
            y: []
        }
    }

    let rectanglesBeforeScale: RectangleType[] | undefined;
    function onScale(
        r: RectangleType,
        proportionally: boolean,
        centered: boolean,
        withSnap: boolean,
        handle: HandleType,
        data: {
            handleX: number;
            handleY: number;
        }
    ) {
        if (!rectanglesBeforeScale) rectanglesBeforeScale = Object.create([...rectangles.map(r => ({...r}))])
        const originalWidth = rectanglesBeforeScale!.find(rb => rb.id === r.id)!.width
        const originalHeight = rectanglesBeforeScale!.find(rb => rb.id === r.id)!.height
        const originalX = rectanglesBeforeScale!.find(rb => rb.id === r.id)!.x
        const originalY = rectanglesBeforeScale!.find(rb => rb.id === r.id)!.y

        const snappingLinesInProcess = {
            x: [] as number[],
            y: [] as number[]
        }

        const naiveResultNormalized = calculateScaling(
            originalX,
            originalY,
            originalWidth,
            originalHeight,
            centered,
            handle,
            data.handleX,
            data.handleY,
            true
        )

        if (withSnap) {
            const SNAP_DISTANCE = 16/zoom;

            const isHandleEast = handle === "ne" || handle === "e" || handle === "se"
            const isHandleWest = handle === "nw" || handle === "w" || handle === "sw"
            const isHandleNorth = handle === "n" || handle === "nw" || handle === "ne"
            const isHandleSouth = handle === "s" || handle === "sw" || handle === "se"

            const canChangeWest = handle === "nw" || handle === "w" || handle === "sw" || (centered && (handle === "ne" || handle === "e" || handle === "se"))
            const canChangeEast = handle === "ne" || handle === "e" || handle === "se" || (centered && (handle === "nw" || handle === "w" || handle === "sw"))
            const canChangeNorth = handle === "n" || handle === "nw" || handle === "ne" || (centered && (handle === "s" || handle === "sw" || handle === "se"))
            const canChangeSouth = handle === "s" || handle === "sw" || handle === "se" || (centered && (handle === "n" || handle === "nw" || handle === "ne"))

            if (isHandleWest || canChangeWest) {
                const nearestXSnap = snappingLines.x.sort((a, b) => Math.abs(a - naiveResultNormalized.scaledX) - Math.abs(b - naiveResultNormalized.scaledX))[0]
                const nearestXSnapDistance = Math.abs(nearestXSnap - naiveResultNormalized.scaledX)
                if (nearestXSnapDistance <= SNAP_DISTANCE) {
                    const direction = nearestXSnap - naiveResultNormalized.scaledX > 0 ? 1 : -1
                    const sign = isHandleWest ? -1 : 1
                    data.handleX += sign * direction * nearestXSnapDistance
                    snappingLinesInProcess.x.push(nearestXSnap);
                }
            } else if (isHandleEast || canChangeEast) {
                const nearestXSnap = snappingLines.x.sort((a, b) => Math.abs(a - naiveResultNormalized.scaledX - naiveResultNormalized.scaledWidth) - Math.abs(b - naiveResultNormalized.scaledX - naiveResultNormalized.scaledWidth))[0]
                const nearestXSnapDistance = Math.abs(nearestXSnap - naiveResultNormalized.scaledX - naiveResultNormalized.scaledWidth)
                if (nearestXSnapDistance <= SNAP_DISTANCE) {
                    const direction = nearestXSnap - naiveResultNormalized.scaledX - naiveResultNormalized.scaledWidth > 0 ? 1 : -1
                    const sign = isHandleEast ? -1 : 1
                    data.handleX += sign * direction * nearestXSnapDistance
                    snappingLinesInProcess.x.push(nearestXSnap);
                }
            }

            if (isHandleNorth || canChangeNorth) {
                const nearestYSnap = snappingLines.y.sort((a, b) => Math.abs(a - naiveResultNormalized.scaledY) - Math.abs(b - naiveResultNormalized.scaledY))[0]
                const nearestYSnapDistance = Math.abs(nearestYSnap - naiveResultNormalized.scaledY)
                if (nearestYSnapDistance <= SNAP_DISTANCE) {
                    const direction = nearestYSnap - naiveResultNormalized.scaledY > 0 ? 1 : -1
                    const sign = isHandleNorth ? -1 : 1
                    data.handleY += sign * direction * nearestYSnapDistance
                    snappingLinesInProcess.y.push(nearestYSnap);
                }
            } else if (isHandleSouth || canChangeSouth) {
                const nearestYSnap = snappingLines.y.sort((a, b) => Math.abs(a - naiveResultNormalized.scaledY - naiveResultNormalized.scaledHeight) - Math.abs(b - naiveResultNormalized.scaledY - naiveResultNormalized.scaledHeight))[0]
                const nearestYSnapDistance = Math.abs(nearestYSnap - naiveResultNormalized.scaledY - naiveResultNormalized.scaledHeight)
                if (nearestYSnapDistance <= SNAP_DISTANCE) {
                    const direction = nearestYSnap - naiveResultNormalized.scaledY - naiveResultNormalized.scaledHeight > 0 ? 1 : -1
                    const sign = isHandleSouth ? -1 : 1
                    data.handleY += sign * direction * nearestYSnapDistance
                    snappingLinesInProcess.y.push(nearestYSnap);
                }
            }
        }

        if (proportionally && (handle === "nw" || handle === "ne" || handle === "se" || handle === "sw")) {
            if (handle === "se") {
                const a = originalHeight / originalWidth;
                const b = 0
                const f = (x: number) => a * x + b;
                const y = f(data.handleX);
                if (y > data.handleY) {
                    data.handleX = (data.handleY - b) / a;
                } else {
                    data.handleY = y
                }
            } else if (handle === "sw") {
                const a = -originalHeight / originalWidth;
                const b = 0
                const f = (x: number) => a * x + b;
                const y = f(data.handleX);
                if (y > data.handleY) {
                    data.handleX = (data.handleY - b) / a;
                } else {
                    data.handleY = y
                }
            } else if (handle === "nw") {
                const a = originalHeight / originalWidth;
                const b = 0
                const f = (x: number) => a * x + b;
                const y = f(data.handleX);
                if (y < data.handleY) {
                    data.handleX = (data.handleY - b) / a;
                } else {
                    data.handleY = y
                }
            } else if (handle === "ne") {
                const a = -originalHeight / originalWidth;
                const b = 0
                const f = (x: number) => a * x + b;
                const y = f(data.handleX);
                if (y < data.handleY) {
                    data.handleX = (data.handleY - b) / a;
                } else {
                    data.handleY = y
                }
            }
        }

        if (handle === "nw") {
            r.x = originalX - data.handleX;
            r.y = originalY - data.handleY;
            r.width = originalWidth + data.handleX * (centered ? 2 : 1);
            r.height = originalHeight + data.handleY * (centered ? 2 : 1);
        } else if (handle === "ne") {
            r.x = originalX + (data.handleX * (centered ? 1 : 0));
            r.y = originalY - data.handleY;
            r.width = originalWidth - data.handleX * (centered ? 2 : 1);
            r.height = originalHeight + data.handleY * (centered ? 2 : 1);
        } else if (handle === "se") {
            r.x = originalX + data.handleX * (centered ? 1 : 0);
            r.y = originalY + data.handleY * (centered ? 1 : 0);
            r.width = originalWidth - data.handleX * (centered ? 2 : 1);
            r.height = originalHeight - data.handleY * (centered ? 2 : 1);
        } else if (handle === "sw") {
            r.x = originalX - data.handleX;
            r.y = originalY + data.handleY * (centered ? 1 : 0);
            r.width = originalWidth + data.handleX * (centered ? 2 : 1);
            r.height = originalHeight - data.handleY * (centered ? 2 : 1);
        } else if (handle === "n") {
            r.y = originalY - data.handleY;
            r.height = originalHeight + data.handleY * (centered ? 2 : 1);
        } else if (handle === "e") {
            r.width = originalWidth - data.handleX * (centered ? 2 : 1);
            r.x = originalX + data.handleX * (centered ? 1 : 0);
        } else if (handle === "s") {
            r.height = originalHeight - data.handleY * (centered ? 2 : 1);
            r.y = originalY + data.handleY * (centered ? 1 : 0);
        } else if (handle === "w") {
            r.width = originalWidth + data.handleX * (centered ? 2 : 1);
            r.x = originalX - data.handleX;
        } else {
            console.error("Invalid handle type");
        }

        const factorWidth = r.width / originalWidth
        const factorHeight = r.height / originalHeight
        const factorX = r.x / originalX
        const factorY = r.y / originalY

        rectanglesBeforeScale!.forEach(rb => {
            if (rb.id === r.id) return
            const rectangle = selectedRectangles.find(r => r.id === rb.id)
            if (!rectangle) return
            rectangle.x = rb.x * factorX
            rectangle.y = rb.y * factorY
            rectangle.width = rb.width * factorWidth
            rectangle.height = rb.height * factorHeight
        })

        usedSnappingLines = snappingLinesInProcess;
    }

    function onScaleFinished() {
        normalizeRectangles();
        rectanglesBeforeScale = undefined;
        usedSnappingLines = {
            x: [],
            y: []
        }
    }

    function normalizeRectangles() {
        rectangles.forEach(r => {
            if (r.width < 0) {
                r.x += r.width;
                r.width = Math.abs(r.width);
            }

            if (r.height < 0) {
                r.y += r.height;
                r.height = Math.abs(r.height);
            }
        })
    }

</script>

<div class="relative w-full h-full">
    <Canvas
            bind:scale={zoom}
            onCanvasClick={() => selectedRectangles = []}
    >
        {#each snappingLines.x.filter(x => usedSnappingLines.x.includes(x)) as x}
            <div
                    class="absolute top-0 left-0 h-dvw border w-[{1/zoom}px] border-red-500 border-dashed"
                    style="transform: translateX({x}px)"
            >
            </div>
        {/each}
        {#each snappingLines.y.filter(y => usedSnappingLines.y.includes(y)) as y}
            <div
                    class="absolute top-0 left-0 w-dvw border h-[{1/zoom}px] border-red-500 border-dashed"
                    style="transform: translateY({y}px)"
            >
            </div>
        {/each}

        {#each rectangles as rectangle, i}
            <div
                    class="absolute"
                    style="
                        top: {rectangle.height >= 0 ? rectangle.y : rectangle.y + rectangle.height}px;
                        left: {rectangle.width >= 0 ? rectangle.x : rectangle.x + rectangle.width}px;
                        width: {Math.abs(rectangle.width)}px;
                        height: {Math.abs(rectangle.height)}px;
                    "

            >
                <Rectangle
                        zoom={zoom}
                        onSelect={(withShift) => select(rectangle, withShift)}
                        onMove={(ctrl, mouseX, mouseY) => onMove(rectangle, mouseX, mouseY, !ctrl)}
                        onMoveFinished={onMoveFinished}
                        onScale={(handle, shift, ctrl, meta, delta) => onScale(rectangle, shift, meta, !ctrl, handle, delta)}
                        onScaleFinished={onScaleFinished}
                        isSelected={selectedRectangles.includes(rectangle)}
                        bind:rect={rectangles[i]}
                />
            </div>
        {/each}
    </Canvas>

    <div class="absolute top-0 right-0 h-full w-1/4 p-4">
        <div class="h-full w-full bg-white p-4 rounded-lg shadow-lg">
            <div class="flex flex-col gap-2 w-full h-full justify-between">
                <div class="w-full h-full flex flex-col gap-2 overflow-y-auto">
                    {#each rectangles as rectangle, index}
                        <div class="flex flex-col gap-2 items-center w-full border border-gray-300 p-2">
                            <div class="flex flex-row items-center justify-between w-full">
                                <span>Rechteck-ID: {index}</span>
                                <button
                                        class="cursor-pointer p-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                                        onclick={() => rectangles = rectangles.filter(r => r.id !== rectangle.id)}
                                >
                                    Delete
                                </button>
                            </div>
                            <input type="number" bind:value={rectangle.x} class="w-full p-2 border rounded-md">
                            <input type="number" bind:value={rectangle.y} class="w-full p-2 border rounded-md">
                            <input type="number" bind:value={rectangle.width} class="w-full p-2 border rounded-md">
                            <input type="number" bind:value={rectangle.height} class="w-full p-2 border rounded-md">
                            <input type="color" bind:value={rectangle.color} class="w-full p-2 border rounded-md">
                        </div>
                    {/each}
                </div>
                <div class="flex flex-col gap-2 items-center w-full">
                    <button
                            class="cursor-pointer p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            onclick={() => rectangles = [...rectangles, {id: rectangles.length, x: 0, y: 0, width: 100, height: 100, color: "#ff0000" }]}
                    >
                        Add rectangle
                    </button>

                    <button
                            class="cursor-pointer p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            onclick={() => {
                                const rectangleJson = JSON.stringify(rectangles, null, 2);
                                navigator.clipboard.writeText(rectangleJson);
                            }}
                    >
                        Copy rectangles to clipboard
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>