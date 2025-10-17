<script lang="ts">
    import {onDestroy} from "svelte";

    let {
        scale = $bindable(1),
        x = $bindable(0),
        y = $bindable(0),
        canvasWidth = 1920,
        canvasHeight = 1080,
    } : {
        scale: number,
        x: number,
        y: number,
        canvasWidth: number,
        canvasHeight: number,
    } = $props();

    let dragging = false;
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let originX = 0;
    let originY = 0;

    function onWheel(e: WheelEvent) {
        e.preventDefault();
        // Mit Strg/Meta (Pinch / Zoom modifier) zoomen, sonst mit Trackpad schwenken
        if (e.ctrlKey || e.metaKey) {
            scale = Math.max(0.1, scale - e.deltaY * 0.001);
        } else {
            x -= e.deltaX;
            y -= e.deltaY;
        }
    }

    function onPointerDown(e: PointerEvent) {
        // Mittlere Maustaste (button === 1) zum Drag-Panning
        if (e.button === 1) {
            (e.target as Element).setPointerCapture(e.pointerId);
            dragging = true;
            pointerId = e.pointerId;
            startX = e.clientX;
            startY = e.clientY;
            originX = x;
            originY = y;
            e.preventDefault();
            document.body.style.cursor = "grabbing";
        }
    }

    function onPointerMove(e: PointerEvent) {
        if (!dragging || e.pointerId !== pointerId) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        x = originX + dx;
        y = originY + dy;
    }

    function onPointerUp(e: PointerEvent) {
        if (dragging && e.pointerId === pointerId) {
            dragging = false;
            pointerId = null;
            try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
            document.body.style.cursor = "unset";
        }
    }

    onDestroy(() => {
        dragging = false;
    });

    let dotSpacing = $derived(Math.max(8, 48/Math.max(0.01, scale)));
    let dotRadius = $derived(Math.max(1, 2/Math.max(0.01, scale)));
    let bgSize = $derived(`${dotSpacing}px ${dotSpacing}px`);
    let bgPos = $derived(`${x}px ${y}px`);
    let gradient = $derived("radial-gradient(circle, rgba(0,0,0,0.2) " + dotRadius + "px, rgba(0,0,0,0) " + (dotRadius+1) + "px)");
    let bgStyle = $derived(`background-image: ${gradient}; background-size: ${bgSize}; background-position: ${bgPos};`);
</script>

<div
        class="flex w-full h-full"
        onwheel={onWheel}
        onpointerdown={onPointerDown}
        onpointermove={onPointerMove}
        onpointerup={onPointerUp}
        style="position:relative; overflow:hidden;"
>
    <div class="dot-bg" style={bgStyle} ></div>

    <span>Hallo</span>

    <!-- Hier kommt der eigentliche Canvas/Content hin -->
</div>

<style>
    .dot-bg {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
    }
</style>