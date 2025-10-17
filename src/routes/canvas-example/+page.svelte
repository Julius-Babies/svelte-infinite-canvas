<script lang="ts">
    import Canvas from "$lib/canvas/Canvas.svelte";

    interface Rectangle {
        id: number;
        x: number;
        y: number;
        width: number;
        height: number;
        color: string
    }

    let rectangles: Rectangle[] = $state([
        {
            "id": 0,
            "x": 80,
            "y": 10,
            "width": 100,
            "height": 100,
            "color": "#ff00ff"
        },
        {
            "id": 1,
            "x": 190,
            "y": 350,
            "width": 800,
            "height": 240,
            "color": "#9f8e23"
        }
    ]);
</script>

<div class="relative w-full h-full">
    <Canvas>
        {#each rectangles as rectangle}
            <div
                    class="absolute"
                    style="top: {rectangle.y}px; left: {rectangle.x}px; width: {rectangle.width}px; height: {rectangle.height}px; background-color: {rectangle.color};"
            ></div>
        {/each}
    </Canvas>

    <div class="absolute top-0 right-0 h-full w-1/4 p-4">
        <div class="h-full w-full bg-white p-4 rounded-lg shadow-lg">
            <div class="flex flex-col gap-2 w-full h-full justify-between">
                <div class="w-full h-full flex flex-col gap-2 overflow-y-scroll">
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