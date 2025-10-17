<script lang="ts">
    import type {Rectangle} from "./script";

    let {
        rect = $bindable(),
        isSelected,
        zoom,
        onSelect,
        onMove,
    }: {
        rect: Rectangle,
        isSelected: boolean,
        zoom: number,
        onSelect: (withShift: boolean) => void,
        onMove: (x: number, y: number) => void,
    } = $props();

    type HandleType = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
    interface Handle {
        type: HandleType,
        x: number,
        y: number,
        cursor: "nw-resize" | "n-resize" | "ne-resize" | "e-resize" | "se-resize" | "s-resize" | "sw-resize" | "w-resize"
    }

    const HANDLE_SIZE_PX = 16;
    let handleSize = $derived(HANDLE_SIZE_PX / zoom);
    let handles: Handle[] = $derived.by(() => {
        return [
            {
                type: "nw",
                x: -handleSize/2,
                y: -handleSize/2,
                cursor: "nw-resize"
            },
            {
                type: "n",
                x: rect.width/2 - handleSize/2,
                y: -handleSize/2,
                cursor: "n-resize"
            },
            {
                type: "ne",
                x: rect.width - handleSize/2,
                y: -handleSize/2,
                cursor: "ne-resize"
            },
            {
                type: "w",
                x: -handleSize/2,
                y: rect.height/2 - handleSize/2,
                cursor: "w-resize"
            },
            {
                type: "e",
                x: rect.width - handleSize/2,
                y: rect.height/2 - handleSize/2,
                cursor: "e-resize"
            },
            {
                type: "sw",
                x: -handleSize/2,
                y: rect.height - handleSize/2,
                cursor: "sw-resize"
            },
            {
                type: "s",
                x: rect.width/2 - handleSize/2,
                y: rect.height - handleSize/2,
                cursor: "s-resize"
            },
            {
                type: "se",
                x: rect.width - handleSize/2,
                y: rect.height - handleSize/2,
                cursor: "se-resize"
            }
        ]
    })

    let selectedHandle: Handle | undefined = $state();
    let isMouseDown = $state(false);
    let isShiftOnDown = false;
    function onMouseDown(e: MouseEvent, handle: Handle | undefined) {
        isMouseDown = true;
        isShiftOnDown = e.shiftKey;
        selectedHandle = handle;
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        e.preventDefault();
    }

    let wasDragging = false;
    function onMouseMove(e: MouseEvent) {
        if (!isMouseDown) return;
        wasDragging = true;
        onMove(e.movementX / zoom, e.movementY / zoom);
    }

    function onMouseUp(e: MouseEvent) {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        if (!wasDragging) onSelect(e.shiftKey || isShiftOnDown);
        isShiftOnDown = false;
        wasDragging = false;
        isMouseDown = false;
        selectedHandle = undefined;
    }
</script>

<button
        onmousedown={(e) => onMouseDown(e, undefined)}
        aria-label="Auswählen"
        class="w-full h-full relative border-black"
        style="background-color: {rect.color};"
        class:border-1={isSelected}
>
    {#if isSelected}
        Auswahl {zoom}

        {#each handles as handle}
            <div
                    style="
                        width: {handleSize}px;
                        height: {handleSize}px;
                        position: absolute;
                        top: {handle.y}px;
                        left: {handle.x}px;
                        cursor: {handle.cursor};
                        border: {1/zoom}px solid black;
                        background-color: white;
                    "
            ></div>
        {/each}
    {/if}

</button>