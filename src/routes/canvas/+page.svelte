<script lang="ts">
    import {onMount, onDestroy} from "svelte";

    let {
        scale = $bindable(1),
        x = $bindable(0),
        y = $bindable(0),
        minScale = 0.1,
        maxScale = 10,
    } : {
        scale?: number,
        x?: number,
        y?: number,
        minScale?: number,
        maxScale?: number,
    } = $props();

    // State management
    let containerRef: HTMLDivElement;
    let dragging = false;
    let spacePressed = false;
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let originX = 0;
    let originY = 0;

    // Touch pinch state
    let touchPoints = new Map<number, {x: number, y: number}>();
    let initialPinchDistance = 0;
    let initialPinchScale = 1;
    let pinchCenter = {x: 0, y: 0};

    // Double-click/tap detection
    let lastClickTime = 0;
    let lastTapTime = 0;
    const DOUBLE_CLICK_THRESHOLD = 300;

    // Clamp scale within bounds
    function clampScale(s: number): number {
        return Math.max(minScale, Math.min(maxScale, s));
    }

    // Zoom to a specific point
    function zoomToPoint(clientX: number, clientY: number, delta: number) {
        if (!containerRef) return;

        const rect = containerRef.getBoundingClientRect();
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;

        // Calculate world position before zoom
        const worldX = (mouseX - x) / scale;
        const worldY = (mouseY - y) / scale;

        // Apply zoom
        const newScale = clampScale(scale * (1 + delta));

        // Adjust position to keep world point under cursor
        x = mouseX - worldX * newScale;
        y = mouseY - worldY * newScale;
        scale = newScale;
    }

    // Wheel handler (zoom with ctrl/meta, pan otherwise)
    function onWheel(e: WheelEvent) {
        e.preventDefault();

        if (e.ctrlKey || e.metaKey) {
            // Zoom around cursor
            const delta = -e.deltaY * 0.01;
            zoomToPoint(e.clientX, e.clientY, delta);
        } else {
            // Trackpad pan (fire-and-forget)
            x -= e.deltaX;
            y -= e.deltaY;
        }
    }

    // Pointer down handler
    function onPointerDown(e: PointerEvent) {
        if (e.pointerType === 'touch') {
            handleTouchStart(e);
            return;
        }

        // Middle mouse button OR left mouse + space
        if (e.button === 1 || (e.button === 0 && spacePressed)) {
            startDrag(e);
        }

        // Left click for double-click detection
        if (e.button === 0 && !spacePressed) {
            const now = Date.now();
            if (now - lastClickTime < DOUBLE_CLICK_THRESHOLD) {
                // Double click - zoom in
                zoomToPoint(e.clientX, e.clientY, 0.5);
                lastClickTime = 0;
            } else {
                lastClickTime = now;
            }
        }
    }

    function startDrag(e: PointerEvent) {
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

    // Pointer move handler
    function onPointerMove(e: PointerEvent) {
        if (e.pointerType === 'touch') {
            handleTouchMove(e);
            return;
        }

        if (!dragging || e.pointerId !== pointerId) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        x = originX + dx;
        y = originY + dy;
    }

    // Pointer up handler
    function onPointerUp(e: PointerEvent) {
        if (e.pointerType === 'touch') {
            handleTouchEnd(e);
            return;
        }

        if (dragging && e.pointerId === pointerId) {
            endDrag(e);
        }
    }

    function endDrag(e: PointerEvent) {
        dragging = false;
        pointerId = null;
        try {
            (e.target as Element).releasePointerCapture(e.pointerId);
        } catch {}
        document.body.style.cursor = spacePressed ? "grab" : "default";
    }

    // Touch handling
    function handleTouchStart(e: PointerEvent) {
        touchPoints.set(e.pointerId, {x: e.clientX, y: e.clientY});

        if (touchPoints.size === 1) {
            // Single touch - check for double tap or start pan
            const now = Date.now();
            if (now - lastTapTime < DOUBLE_CLICK_THRESHOLD) {
                // Double tap - zoom in
                zoomToPoint(e.clientX, e.clientY, 0.5);
                lastTapTime = 0;
                touchPoints.clear();
            } else {
                lastTapTime = now;
                startDrag(e);
            }
        } else if (touchPoints.size === 2) {
            // Two fingers - prepare for pinch
            if (dragging) {
                endDrag(e);
            }

            const points = Array.from(touchPoints.values());
            const dx = points[1].x - points[0].x;
            const dy = points[1].y - points[0].y;
            initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
            initialPinchScale = scale;
            pinchCenter = {
                x: (points[0].x + points[1].x) / 2,
                y: (points[0].y + points[1].y) / 2
            };
        }
    }

    function handleTouchMove(e: PointerEvent) {
        if (!touchPoints.has(e.pointerId)) return;
        touchPoints.set(e.pointerId, {x: e.clientX, y: e.clientY});

        if (touchPoints.size === 1 && dragging) {
            // Single touch pan
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            x = originX + dx;
            y = originY + dy;
        } else if (touchPoints.size === 2) {
            // Two finger pinch/pan
            const points = Array.from(touchPoints.values());
            const dx = points[1].x - points[0].x;
            const dy = points[1].y - points[0].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Calculate new center
            const newCenter = {
                x: (points[0].x + points[1].x) / 2,
                y: (points[0].y + points[1].y) / 2
            };

            if (!containerRef) return;
            const rect = containerRef.getBoundingClientRect();

            // Zoom around pinch center
            const centerX = pinchCenter.x - rect.left;
            const centerY = pinchCenter.y - rect.top;
            const worldX = (centerX - x) / scale;
            const worldY = (centerY - y) / scale;

            const newScale = clampScale(initialPinchScale * (distance / initialPinchDistance));

            x = centerX - worldX * newScale + (newCenter.x - pinchCenter.x);
            y = centerY - worldY * newScale + (newCenter.y - pinchCenter.y);
            scale = newScale;
        }
    }

    function handleTouchEnd(e: PointerEvent) {
        touchPoints.delete(e.pointerId);

        if (touchPoints.size === 0) {
            if (dragging) {
                endDrag(e);
            }
        } else if (touchPoints.size === 1) {
            // Reset to single touch pan
            const remaining = Array.from(touchPoints.entries())[0];
            const point = remaining[1];
            pointerId = remaining[0];
            startX = point.x;
            startY = point.y;
            originX = x;
            originY = y;
            dragging = true;
        }
    }

    // Keyboard handling
    function onKeyDown(e: KeyboardEvent) {
        // Space key for pan mode
        if (e.code === 'Space' && !spacePressed) {
            spacePressed = true;
            document.body.style.cursor = "grab";
            e.preventDefault();
            return;
        }

        // Reset (R)
        if (e.code === 'KeyR') {
            x = 0;
            y = 0;
            scale = 1;
            e.preventDefault();
            return;
        }

        // Zoom (+ / -)
        if (e.code === 'Equal' || e.code === 'NumpadAdd') {
            if (!containerRef) return;
            const rect = containerRef.getBoundingClientRect();
            zoomToPoint(rect.width / 2, rect.height / 2, 0.1);
            e.preventDefault();
            return;
        }
        if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
            if (!containerRef) return;
            const rect = containerRef.getBoundingClientRect();
            zoomToPoint(rect.width / 2, rect.height / 2, -0.1);
            e.preventDefault();
            return;
        }

        // Arrow keys / WASD for nudging
        const nudgeDistance = e.shiftKey ? 50 : 10;
        let handled = true;

        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                x += nudgeDistance;
                break;
            case 'ArrowRight':
            case 'KeyD':
                x -= nudgeDistance;
                break;
            case 'ArrowUp':
            case 'KeyW':
                y += nudgeDistance;
                break;
            case 'ArrowDown':
            case 'KeyS':
                y -= nudgeDistance;
                break;
            default:
                handled = false;
        }

        if (handled) {
            e.preventDefault();
        }
    }

    function onKeyUp(e: KeyboardEvent) {
        if (e.code === 'Space') {
            spacePressed = false;
            document.body.style.cursor = dragging ? "grabbing" : "default";
            e.preventDefault();
        }
    }

    // Setup and cleanup
    onMount(() => {
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
    });

    onDestroy(() => {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        dragging = false;
        spacePressed = false;
        touchPoints.clear();
        document.body.style.cursor = "default";
    });

    // Derived styles - intelligent dot grid
    // Base spacing in world coordinates (constant)
    const BASE_SPACING = 50;

    // Find the appropriate grid level based on scale
    // We want dots to appear at reasonable intervals (20-80px on screen)
    let gridLevel = $derived(() => {
        const screenSpacing = BASE_SPACING * scale;

        // If too dense, jump to next level (double spacing)
        if (screenSpacing < 20) {
            let level = 1;
            while (BASE_SPACING * Math.pow(2, level) * scale < 20 && level < 6) {
                level++;
            }
            return level;
        }

        // If too sparse, jump to previous level (half spacing)
        if (screenSpacing > 80) {
            let level = -1;
            while (BASE_SPACING * Math.pow(2, level) * scale > 80 && level > -6) {
                level--;
            }
            return level;
        }

        return 0;
    });

    // Calculate actual spacing based on grid level
    let worldSpacing = $derived(BASE_SPACING * Math.pow(2, gridLevel()));
    let screenSpacing = $derived(worldSpacing * scale);

    // Dot size: smaller at lower zoom levels, but never too small
    let dotRadius = $derived(Math.max(1, Math.min(3, scale * 1.5)));

    // Opacity: fade out dots that are getting too dense before level switch
    let dotOpacity = $derived(() => {
        const spacing = screenSpacing;
        if (spacing < 20) {
            return Math.max(0.05, (spacing - 10) / 10);
        }
        if (spacing > 80) {
            return Math.max(0.05, 1 - (spacing - 80) / 30);
        }
        return 0.2;
    });

    let bgSize = $derived(`${screenSpacing}px ${screenSpacing}px`);
    let bgPos = $derived(`${x}px ${y}px`);
    let gradient = $derived(`radial-gradient(circle, rgba(0,0,0,${dotOpacity()}) ${dotRadius}px, rgba(0,0,0,0) ${dotRadius + 1}px)`);
    let bgStyle = $derived(`background-image: ${gradient}; background-size: ${bgSize}; background-position: ${bgPos};`);
</script>

<div
        bind:this={containerRef}
        class="canvas-container"
        role="application"
        aria-label="Infinite canvas - Use mouse wheel + Ctrl to zoom, middle click or Space + drag to pan, arrow keys to nudge, R to reset"
        onwheel={onWheel}
        onpointerdown={onPointerDown}
        onpointermove={onPointerMove}
        onpointerup={onPointerUp}
        onpointercancel={onPointerUp}
>
    <div class="dot-bg" style={bgStyle}></div>

    <div class="content" style="transform: translate({x}px, {y}px) scale({scale})">
        <div class="demo-box">
            <h2>Infinite Canvas</h2>
            <p>Scale: {scale.toFixed(2)}x</p>
            <p>Position: ({Math.round(x)}, {Math.round(y)})</p>
            <ul>
                <li>Wheel + Ctrl/⌘: Zoom</li>
                <li>Middle click / Space + Drag: Pan</li>
                <li>Double-click: Zoom in</li>
                <li>Arrow keys / WASD: Nudge (+ Shift)</li>
                <li>+/- keys: Zoom</li>
                <li>R: Reset</li>
                <li>Touch: Pinch to zoom, 2-finger pan</li>
            </ul>
        </div>
    </div>
</div>

<style>
    .canvas-container {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        touch-action: none;
        user-select: none;
        outline: none;
    }

    .canvas-container:focus-visible {
        outline: 2px solid #4A90E2;
        outline-offset: -2px;
    }

    .dot-bg {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        background-color: #f8f9fa;
    }

    .content {
        position: absolute;
        top: 0;
        left: 0;
        transform-origin: 0 0;
        z-index: 1;
        pointer-events: none;
    }

    .demo-box {
        pointer-events: auto;
        background: white;
        border: 2px solid #333;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        width: 300px;
        margin: 50px;
    }

    .demo-box h2 {
        margin: 0 0 16px 0;
        font-size: 24px;
        color: #333;
    }

    .demo-box p {
        margin: 8px 0;
        color: #666;
        font-family: monospace;
    }

    .demo-box ul {
        margin: 16px 0 0 0;
        padding-left: 20px;
        color: #555;
        font-size: 14px;
        line-height: 1.6;
    }

    .demo-box li {
        margin: 4px 0;
    }
</style>