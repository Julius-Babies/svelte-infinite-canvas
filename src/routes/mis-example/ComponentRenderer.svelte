<script lang="ts">
    import type {Component} from "./component";
    import Rectangle from "./components/Rectangle.svelte";
    import {getHandles, type HandleType} from "./handle";
    import {canvasMousePosition, canvasScale} from "./state";
    import {setMouseBeforeMove} from "./move";
    import Ellipse from "./components/Ellipse.svelte";
    import {setMouseBeforeScale} from "./scale";

    let {
        component,
        isSelected,
        onclick,
        onmove,
        onmovedone,
        onscale,
        onscaledone,
    }: {
        component: Component,
        isSelected: boolean,
        onclick?: (e: MouseEvent) => void,
        onmove?: () => void,
        onmovedone?: () => void,
        onscale?: (handle: HandleType) => void,
        onscaledone?: () => void,
    } = $props();

    let handles = $derived(getHandles($canvasScale, component.position.width, component.position.height))

    let isComponentMouseDown = $state(false);

    function onComponentMouseDown(e: MouseEvent) {
        if (e.button !== 0) return;
        isComponentMouseDown = true;
        setMouseBeforeMove($canvasMousePosition.x, $canvasMousePosition.y)
        e.preventDefault();
        e.stopPropagation();
        document.addEventListener("mousemove", onMouseMoveComponent);
        document.addEventListener("mouseup", onMouseUpComponent);
    }

    let wasDragged = $state(false);
    function onMouseMoveComponent() {
        if (!isComponentMouseDown) return;
        if (onmove) wasDragged = true;
        onmove?.()
    }

    function onMouseUpComponent(e: MouseEvent) {
        if (wasDragged) {
            onmovedone?.()
            console.log("moved");
            wasDragged = false;
        } else {
            onclick?.(e);
        }

        isComponentMouseDown = false;
        document.removeEventListener("mousemove", onMouseMoveComponent);
        document.removeEventListener("mouseup", onMouseUpComponent);
    }

    let selectedHandle = $state<HandleType | null>(null);
    function onMouseDownHandle(e: MouseEvent, handle: HandleType) {
        if (e.button !== 0) return;
        selectedHandle = handle;
        setMouseBeforeScale($canvasMousePosition.x, $canvasMousePosition.y)
        document.addEventListener("mouseup", onMouseUpHandle);
        document.addEventListener("mousemove", onMouseMoveHandle);
        e.preventDefault();
        e.stopPropagation();
    }

    function onMouseMoveHandle() {
        if (!selectedHandle) return;
        if (onscale) onscale(selectedHandle);
    }

    function onMouseUpHandle() {
        selectedHandle = null;
        if (onscaledone) onscaledone();
        document.removeEventListener("mouseup", onMouseUpHandle);
        document.removeEventListener("mousemove", onMouseMoveHandle);
    }
</script>

<div
        aria-hidden="true"
        onmousedown={onComponentMouseDown}
        class="absolute"
        style="left: {Math.min(component.position.x, component.position.x + component.position.width)}px; top: {Math.min(component.position.y, component.position.y + component.position.height)}px; width: {Math.abs(component.position.width)}px; height: {Math.abs(component.position.height)}px;"
>
    {#if component.type === "rectangle"}
        <Rectangle rectangle={component}/>
    {:else if component.type === "ellipse"}
        <Ellipse ellipse={component}/>
    {/if}

    <div class="absolute text-2xl" style="zoom: {1/$canvasScale};">
        {component.position.height / component.position.width}
    </div>

    {#if isSelected}
        <div
                class="absolute w-full h-full border border-b-black"
        >
        </div>
        {#each handles.handles as handle}
            <button
                    onmousedown={(e) => onMouseDownHandle(e, handle.type)}
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