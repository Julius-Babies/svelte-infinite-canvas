<script lang="ts">
    import Canvas from "$lib/canvas/Canvas.svelte";
    import type {HandleType, Rectangle as RectangleType} from "./script";
    import Rectangle from "./Rectangle.svelte";

    let zoom = $state(1);

    let rectangles: RectangleType[] = $state([
        {
            "id": 0,
            "x": 0,
            "y": 0,
            "width": 100,
            "height": 300,
            "color": "#ff00ff",
            "isFlippedHorizontally": false,
            "isFlippedVertically": false
        },
        {
            "id": 1,
            "x": 326,
            "y": 92,
            "width": 800,
            "height": 240,
            "color": "#9f8e23",
            "isFlippedHorizontally": false,
            "isFlippedVertically": false
        }
    ]);

    let selectedRectangles: RectangleType[] = $state([]);

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

    function onMove(rectangle: RectangleType, deltaX: number, deltaY: number) {
        if (!selectedRectangles.includes(rectangle)) selectedRectangles = [rectangle];
        selectedRectangles.forEach(r => {
            r.x += deltaX;
            r.y += deltaY;
        })
    }

    let rectanglesBeforeScale: RectangleType[] | undefined;

    function onScale(
        r: RectangleType,
        proportionally: boolean,
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
            r.width = originalWidth + data.handleX;
            r.height = originalHeight + data.handleY;
        } else if (handle === "ne") {
            r.y = originalY - data.handleY;
            r.width = originalWidth - data.handleX;
            r.height = originalHeight + data.handleY;
        } else if (handle === "se") {
            r.width = originalWidth - data.handleX;
            r.height = originalHeight - data.handleY;
        } else if (handle === "sw") {
            r.x = originalX - data.handleX;
            r.width = originalWidth + data.handleX;
            r.height = originalHeight - data.handleY;
        } else if (handle === "n") {
            r.y = originalY - data.handleY;
            r.height = originalHeight + data.handleY;
        } else if (handle === "e") {
            r.width = originalWidth - data.handleX;
        } else if (handle === "s") {
            r.height = originalHeight - data.handleY;
        } else if (handle === "w") {
            r.x = originalX - data.handleX;
            r.width = originalWidth + data.handleX;
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
    }

    function onScaleFinished() {
        normalizeRectangles();
        rectanglesBeforeScale = undefined;
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
                        onMove={(deltaX, deltaY) => onMove(rectangle, deltaX, deltaY)}
                        onScale={(handle, shift, delta) => onScale(rectangle, shift, handle, delta)}
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