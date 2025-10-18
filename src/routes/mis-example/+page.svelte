<script lang="ts">
    import Canvas from "$lib/canvas/Canvas.svelte";
    import {Circle, RectangleHorizontal} from "@lucide/svelte";
    import {
        canvasMousePosition,
        canvasOffsetX,
        canvasOffsetY,
        canvasScale,
        components,
        frames, screenToWorld
    } from "./state";
    import {addEllipse, addRectangle} from "./toolbar";
    import ComponentRenderer from "./ComponentRenderer.svelte";
    import {onMount} from "svelte";
    import {mouse} from "$lib/state/mouse";
    import {onSelect, selectedComponents} from "./selection";
    import {move, stopMove, usedSnappingLines} from "./move";
    import {get} from "svelte/store";
    import {isCtrlPressed, isMetaPressed, isShiftPressed} from "$lib/state/keyboard";
    import {scale, stopScale} from "./scale";

    let canvasContainer: HTMLDivElement | undefined = $state(undefined);

    onMount(() => {
        const mouseUnsubscriber = mouse.subscribe(mouse => {
            if (!canvasContainer) return;
            const canvasBoundingRect = canvasContainer.getBoundingClientRect();
            const mousePosition = screenToWorld(
                mouse.x,
                mouse.y,
                canvasBoundingRect,
                $canvasOffsetX,
                $canvasOffsetY,
                $canvasScale
            )
            canvasMousePosition.set({x: mousePosition.worldX, y: mousePosition.worldY})
        })

        return () => {
            mouseUnsubscriber();
        }
    })
</script>

<div class="relative w-full h-full">
    <Canvas
            bind:scale={$canvasScale}
            bind:x={$canvasOffsetX}
            bind:y={$canvasOffsetY}
            bind:container={canvasContainer}
            onCanvasClick={() => onSelect(null, false)}
    >

        {#each $frames as frame}
            <div
                    onclick={() => selectedComponents.set([])}
                    aria-hidden="true"
                    class="absolute bg-white rounded-4xl shadow-xl"
                    style="left: {frame.position.x}px; top: {frame.position.y}px; width: {frame.position.width}px; height: {frame.position.height}px;"
            >
                <div class="absolute -top-5 left-0 w-full text-xs text-gray-700 text-nowrap text-ellipsis overflow-hidden" style="zoom: {1/$canvasScale};">
                    Frame {frame.id}
                </div>
                <div class="absolute top-0 left-0 w-full h-full rounded-4xl overflow-hidden">
                    {#if $usedSnappingLines && $usedSnappingLines.frameId === frame.id}
                        {#each $usedSnappingLines.x as x}
                            <div
                                    class="absolute top-0 left-0 h-dvw border w-[{1/$canvasScale}px] border-red-500 border-dashed"
                                    style="transform: translateX({x}px)"
                            >
                            </div>
                        {/each}
                        {#each $usedSnappingLines.y as y}
                            <div
                                    class="absolute top-0 left-0 h-[{1/$canvasScale}px] border w-full border-red-500 border-dashed"
                                    style="transform: translateY({y}px)"
                            >
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        {/each}

        {#each $components as component}
            <ComponentRenderer
                    component={component}
                    isSelected={$selectedComponents.includes(component)}
                    onclick={(e) => onSelect(component, e.shiftKey)}
                    onmove={() => move(component, get(canvasMousePosition).x, get(canvasMousePosition).y, !get(isCtrlPressed))}
                    onmovedone={stopMove}
                    onscale={(handle) => scale(component, handle, get(canvasMousePosition).x, get(canvasMousePosition).y, !get(isCtrlPressed), get(isMetaPressed), get(isShiftPressed))}
                    onscaledone={stopScale}
            />
        {/each}

    </Canvas>

    <div class="absolute bottom-4 left-0 w-full flex justify-center items-center">
        <div class="bg-white rounded-4xl shadow-xl p-2 flex flex-row gap-2 items-center">
            <button
                    onclick={addRectangle}
                    class="rounded-full h-10 w-10 flex justify-center items-center transition-colors hover:bg-gray-200 cursor-pointer"
            >
                <RectangleHorizontal class="w-6 h-6" />
            </button>
            <button
                    onclick={addEllipse}
                    class="rounded-full h-10 w-10 flex justify-center items-center transition-colors hover:bg-gray-200 cursor-pointer"
            >
                <Circle class="w-6 h-6" />
            </button>
        </div>
    </div>

    <div class="absolute bottom-4 right-4 flex justify-center items-center bg-white rounded-4xl shadow-xl p-2 gap-2">
        <div class="flex flex-col text-xs font-semibold text-gray-700">
            <span>Drag X: {$canvasOffsetX.toFixed(2)}</span>
            <span>Drag Y: {$canvasOffsetY.toFixed(2)}</span>
        </div>
        <div class="flex flex-col text-xs font-semibold text-gray-700">
            <span>App-Mouse X: {$mouse.x.toFixed(2)}</span>
            <span>App-Mouse Y: {$mouse.y.toFixed(2)}</span>
        </div>
        <div class="flex flex-col text-xs font-semibold text-gray-700">
            <span>Canvas-Mouse X: {$canvasMousePosition.x.toFixed(2)}</span>
            <span>Canvas-Mouse Y: {$canvasMousePosition.y.toFixed(2)}</span>
        </div>
        <div class="text-xs font-semibold text-gray-700 self-start">
            Zoom: {$canvasScale.toFixed(2)}x
        </div>
    </div>
</div>