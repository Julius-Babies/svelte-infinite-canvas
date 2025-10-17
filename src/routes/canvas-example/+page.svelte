<script lang="ts">
    import Canvas from "$lib/canvas/Canvas.svelte";
    import type {HandleType, Rectangle as RectangleType} from "./script";
    import Rectangle from "./Rectangle.svelte";

    let zoom = $state(1);

    let rectangles: RectangleType[] = $state([
        {
            "id": 0,
            "x": 87,
            "y": 88,
            "width": 100,
            "height": 100,
            "color": "#ff00ff",
            isFlippedHorizontally: false,
            isFlippedVertically: false,
        },
        {
            "id": 1,
            "x": 326,
            "y": 92,
            "width": 800,
            "height": 240,
            "color": "#9f8e23",
            isFlippedHorizontally: false,
            isFlippedVertically: false,
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

    function onScale(rectangle: RectangleType, handle: HandleType, delta: { x: number, y: number }) {
        const beforeWidth = rectangle.width;
        const beforeHeight = rectangle.height;
        let deltaX = 0;
        let deltaY = 0;
        let deltaWidth = 0;
        let deltaHeight = 0;

        switch (handle) {
            case "nw":
                deltaX = delta.x;
                deltaY = delta.y;
                deltaWidth = -delta.x;
                deltaHeight = -delta.y;
                break;
            case "n":
                deltaY = delta.y;
                deltaHeight = -delta.y;
                break;
            case "ne":
                deltaY = delta.y;
                deltaWidth = delta.x;
                deltaHeight = -delta.y;
                break;
            case "e":
                deltaWidth = delta.x;
                break;
            case "se":
                deltaWidth = delta.x;
                deltaHeight = delta.y;
                break;
            case "s":
                deltaHeight = delta.y;
                break;
            case "sw":
                deltaX = delta.x;
                deltaWidth = -delta.x;
                deltaHeight = delta.y;
                break;
            case "w":
                deltaX = delta.x;
                deltaWidth = -delta.x;
                break;
        }

        rectangle.x += deltaX;
        rectangle.y += deltaY;
        rectangle.width += deltaWidth;
        rectangle.height += deltaHeight;

        selectedRectangles
            .filter(r => r !== rectangle)
            .forEach(r => {
                const rBeforeWidth = r.width;
                const rBeforeHeight = r.height;
                const rWidthFactor = rBeforeWidth / beforeWidth;
                const rHeightFactor = rBeforeHeight / beforeHeight;
                r.x += (rWidthFactor * deltaX);
                r.y += (rHeightFactor * deltaY);
                r.width += (rWidthFactor * deltaWidth);
                r.height += (rHeightFactor * deltaHeight);
            })
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
                        onScale={(handle, delta) => onScale(rectangle, handle, delta)}
                        onScaleFinished={normalizeRectangles}
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