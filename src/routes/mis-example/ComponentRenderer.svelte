<script lang="ts">
    import type {Component} from "./component";
    import Rectangle from "./components/Rectangle.svelte";

    let {
        component
    }: {
        component: Component
    } = $props();
</script>

<div
        class="absolute"
        style="left: {component.position.x}px; top: {component.position.y}px; width: {component.position.width}px; height: {component.position.height}px;"
>
    {#if component.type === "rectangle"}
        <Rectangle rectangle={component} />
    {/if}
</div>