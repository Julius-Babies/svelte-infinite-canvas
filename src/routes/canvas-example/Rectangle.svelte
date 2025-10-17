<script lang="ts">
    import type {HandleType, Rectangle} from "./script";

    let {
        rect = $bindable(),
        isSelected,
        zoom,
        onSelect,
        onMove,
        onScale,
        onScaleFinished,
    }: {
        rect: Rectangle,
        isSelected: boolean,
        zoom: number,
        onSelect: (withShift: boolean) => void,
        onMove: (x: number, y: number) => void,
        onScale: (handle: HandleType, mouse: { handleX: number, handleY: number }) => void,
        onScaleFinished: () => void,
    } = $props();

    interface Handle {
        type: HandleType,
        x: number,
        y: number,
        cursor: "nw-resize" | "n-resize" | "ne-resize" | "e-resize" | "se-resize" | "s-resize" | "sw-resize" | "w-resize"
    }

    const HANDLE_SIZE_PX = 16;
    let handleSize = $derived(HANDLE_SIZE_PX / zoom);
    let handles: Handle[] = $derived.by(() => {
        const w = rect.width;
        const h = rect.height;

        // Vorzeichen für Spiegelung
        const flipX = w < 0 ? -1 : 1;
        const flipY = h < 0 ? -1 : 1;

        const absW = Math.abs(w);
        const absH = Math.abs(h);

        return [
            {
                type: "nw",
                x: (flipX === 1 ? 0 : absW) - handleSize / 2,
                y: (flipY === 1 ? 0 : absH) - handleSize / 2,
                cursor: "nw-resize"
            },
            {type: "n", x: absW / 2 - handleSize / 2, y: (flipY === 1 ? 0 : absH) - handleSize / 2, cursor: "n-resize"},
            {
                type: "ne",
                x: (flipX === 1 ? absW : 0) - handleSize / 2,
                y: (flipY === 1 ? 0 : absH) - handleSize / 2,
                cursor: "ne-resize"
            },
            {type: "w", x: (flipX === 1 ? 0 : absW) - handleSize / 2, y: absH / 2 - handleSize / 2, cursor: "w-resize"},
            {type: "e", x: (flipX === 1 ? absW : 0) - handleSize / 2, y: absH / 2 - handleSize / 2, cursor: "e-resize"},
            {
                type: "sw",
                x: (flipX === 1 ? 0 : absW) - handleSize / 2,
                y: (flipY === 1 ? absH : 0) - handleSize / 2,
                cursor: "sw-resize"
            },
            {type: "s", x: absW / 2 - handleSize / 2, y: (flipY === 1 ? absH : 0) - handleSize / 2, cursor: "s-resize"},
            {
                type: "se",
                x: (flipX === 1 ? absW : 0) - handleSize / 2,
                y: (flipY === 1 ? absH : 0) - handleSize / 2,
                cursor: "se-resize"
            }
        ]
    });


    let selectedHandle: Handle | undefined = $state();
    let isMouseDownStartingPosition: { x: number, y: number } | null = $state(null);
    let elementPositionBeforeDrag: { x: number, y: number, width: number, height: number } | null = $state(null);
    let isShiftOnDown = false;

    function onMouseDown(e: MouseEvent, handle: Handle | undefined) {
        isMouseDownStartingPosition = {x: e.clientX, y: e.clientY};
        elementPositionBeforeDrag = {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
        }
        isShiftOnDown = e.shiftKey;
        selectedHandle = handle;
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        e.preventDefault();
        e.stopPropagation();
    }

    let wasDragging = false;

    function onMouseMove(e: MouseEvent) {
        if (!isMouseDownStartingPosition) return;
        wasDragging = true;
        if (selectedHandle && elementPositionBeforeDrag) {
            const mouseX = isMouseDownStartingPosition.x - e.clientX;
            const mouseY = isMouseDownStartingPosition.y - e.clientY;
            onScale(selectedHandle.type, { handleX: mouseX / zoom, handleY: mouseY / zoom });
        }
        else onMove(e.movementX / zoom, e.movementY / zoom);
    }

    function onMouseUp(e: MouseEvent) {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        if (selectedHandle) onScaleFinished();
        if (!wasDragging && !selectedHandle) onSelect(e.shiftKey || isShiftOnDown);
        isShiftOnDown = false;
        wasDragging = false;
        isMouseDownStartingPosition = null;
        selectedHandle = undefined;
    }
</script>

<div
        onmousedown={(e) => onMouseDown(e, undefined)}
        aria-label="Auswählen"
        role="button"
        tabindex="0"
        class="w-full h-full relative border-black"
        style="background-color: {rect.color};"
        class:border-1={isSelected}
>
    {#if isSelected}
        Auswahl {zoom}

        {#each handles as handle}
            <button
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
                    aria-label="Handle {handle.type}"
                    onmousedown={(e) => onMouseDown(e, handle)}
            ></button>
        {/each}
    {/if}

</div>