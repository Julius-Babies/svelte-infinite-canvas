<script lang="ts">
    import type {Component} from "./component";
    import Rectangle from "./components/Rectangle.svelte";
    import {getHandles} from "./handle";
    import {canvasMousePosition, canvasScale} from "./state";
    import {setMouseBeforeMove} from "./move";
    import Ellipse from "./components/Ellipse.svelte";

    let {
        component,
        isSelected,
        onclick,
        onmove,
        onmovedone,
    }: {
        component: Component,
        isSelected: boolean,
        onclick?: (e: MouseEvent) => void,
        onmove?: () => void,
        onmovedone?: () => void,
    } = $props();

    let handles = $derived(getHandles($canvasScale, component.position.width, component.position.height))

    let isComponentMouseDown = $state(false);

    function onComponentMouseDown(e: MouseEvent) {
        isComponentMouseDown = true;
        setMouseBeforeMove($canvasMousePosition.x, $canvasMousePosition.y)
        e.preventDefault();
        e.stopPropagation();
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }

    let wasDragged = $state(false);
    function onMouseMove() {
        if (!isComponentMouseDown) return;
        if (onmove) wasDragged = true;
        onmove?.()
    }

    function onMouseUp(e: MouseEvent) {
        if (wasDragged) {
            onmovedone?.()
            console.log("moved");
            wasDragged = false;
        } else {
            onclick?.(e);
        }

        isComponentMouseDown = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    }
</script>

<div
        aria-hidden="true"
        onmousedown={onComponentMouseDown}
        class="absolute"
        style="left: {component.position.x}px; top: {component.position.y}px; width: {component.position.width}px; height: {component.position.height}px;"
>
    {#if component.type === "rectangle"}
        <Rectangle rectangle={component}/>
    {:else if component.type === "ellipse"}
        <Ellipse ellipse={component}/>
    {/if}

    {#if isSelected}
        <div
                class="absolute w-full h-full border border-b-black"
        >
        </div>
        {#each handles.handles as handle}
            <button
                    aria-label="Handle"
                    class="absolute"
                    style="left: {handle.x}px; top: {handle.y}px; width: {handles.handleSize}px; height: {handles.handleSize}px; cursor: {handle.cursor};"
            >
                <div
                        class="w-full h-full bg-black border-4 border-white -outline-offset-1 outline-2 outline-black"
                        style="zoom: {1/$canvasScale};"
                ></div>

            </button>
        {/each}
    {/if}
</div>