<script lang="ts">
    import type {Component} from "./component";
    import Rectangle from "./components/Rectangle.svelte";
    import {getHandles} from "./handle";
    import {canvasScale} from "./state";

    let {
        component,
        isSelected,
        onclick
    }: {
        component: Component,
        isSelected: boolean,
        onclick?: (e: MouseEvent) => void
    } = $props();

    let handles = $derived(getHandles($canvasScale, component.position.width, component.position.height))
</script>

<div
        aria-hidden="true"
        onclick={onclick}
        class="absolute"
        style="left: {component.position.x}px; top: {component.position.y}px; width: {component.position.width}px; height: {component.position.height}px;"
>
    {#if component.type === "rectangle"}
        <Rectangle rectangle={component}/>
    {/if}

    {#if isSelected}
        <div
                class="absolute w-full h-full border border-b-black"
        >
        </div>
        {#each handles.handles as handle}
            <div
                    class="absolute"
                    style="left: {handle.x}px; top: {handle.y}px; width: {handles.handleSize}px; height: {handles.handleSize}px; cursor: {handle.cursor};"
            >
                <div
                        class="w-full h-full bg-black border-4 border-white -outline-offset-1 outline-2 outline-black"
                        style="zoom: {1/$canvasScale};"
                ></div>

            </div>
        {/each}
    {/if}
</div>