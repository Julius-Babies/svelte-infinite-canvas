<script lang="ts">
    import {onMount} from "svelte";

    let {
        scale = $bindable(1),
        x = $bindable(0),
        y = $bindable(0),
        minScale = 0.1,
        maxScale = 10,
        children,
    }: {
        scale?: number,
        x?: number,
        y?: number,
        minScale?: number,
        maxScale?: number,
        children?: import('svelte').Snippet,
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

    // Animation targets for smooth keyboard movement/zoom
    let targetX = x;
    let targetY = y;
    let targetScale = scale;
    let animating = false;
    const ANIM_DAMPING = 0.18; // easing factor (0-1), higher = snappier
    const EPS = 0.001;

    // Touch pinch state
    let touchPoints = new Map<number, { x: number, y: number }>();
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

    // Smooth animation loop: tween current x/y/scale towards targets
    let rafId: number | null = null;
    function startAnimation() {
        if (animating) return;
        animating = true;
        rafId = requestAnimationFrame(animateStep);
    }

    function stopAnimation() {
        animating = false;
        if (rafId != null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function animateStep() {
        // Move current values towards target values using exponential smoothing
        const dx = targetX - x;
        const dy = targetY - y;
        const ds = targetScale - scale;

        x += dx * ANIM_DAMPING;
        y += dy * ANIM_DAMPING;
        scale += ds * ANIM_DAMPING;

        // If we're very close to target, snap and stop
        if (Math.abs(dx) + Math.abs(dy) + Math.abs(ds) < EPS) {
            x = targetX;
            y = targetY;
            scale = targetScale;
            stopAnimation();
            return;
        }

        rafId = requestAnimationFrame(animateStep);
    }

    // Zoom to a specific point. If animate=true, set targets and start animation,
    // otherwise apply immediately.
    function zoomToPoint(clientX: number, clientY: number, delta: number, animate = false) {
        if (!containerRef) return;

        const rect = containerRef.getBoundingClientRect();

        // Mouse position relative to container
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;

        // World position at mouse (before zoom)
        const worldX = (mouseX - x) / scale;
        const worldY = (mouseY - y) / scale;

        // Apply new scale
        const newScale = clampScale(scale * (1 + delta));

        // Compute new position so world point stays under mouse
        const newX = mouseX - worldX * newScale;
        const newY = mouseY - worldY * newScale;

        if (animate) {
            targetScale = newScale;
            targetX = newX;
            targetY = newY;
            startAnimation();
        } else {
            scale = newScale;
            x = newX;
            y = newY;
            // keep targets in sync so ongoing animations don't fight
            targetScale = scale;
            targetX = x;
            targetY = y;
        }
    }

    // Wheel handler (zoom with ctrl/meta, pan otherwise)
    function onWheel(e: WheelEvent) {
        e.preventDefault();

        if (e.ctrlKey || e.metaKey) {
            // Zoom around cursor (immediate; wheel should feel responsive)
            const delta = -e.deltaY * 0.01;
            zoomToPoint(e.clientX, e.clientY, delta, false);
        } else {
            // Trackpad pan (fire-and-forget) - apply immediately and sync targets
            x -= e.deltaX;
            y -= e.deltaY;
            targetX = x;
            targetY = y;
            stopAnimation();
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
                // Double click - zoom in (keep immediate)
                zoomToPoint(e.clientX, e.clientY, 0.5, false);
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
        // Cancel any keyboard-driven animation while user interacts
        stopAnimation();
        // Keep targets synced so animation doesn't resume unexpectedly
        targetX = x;
        targetY = y;
        targetScale = scale;
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
        // Keep targets in sync so keyboard animation doesn't fight
        targetX = x;
        targetY = y;
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
        } catch {
        }
        document.body.style.cursor = spacePressed ? "grab" : "default";
        // After user stops dragging, ensure targets match final pos
        targetX = x;
        targetY = y;
    }

    // Touch handling
    function handleTouchStart(e: PointerEvent) {
        touchPoints.set(e.pointerId, {x: e.clientX, y: e.clientY});

        if (touchPoints.size === 1) {
            // Single touch - check for double tap or start pan
            const now = Date.now();
            if (now - lastTapTime < DOUBLE_CLICK_THRESHOLD) {
                // Double tap - zoom in
                zoomToPoint(e.clientX, e.clientY, 0.5, false);
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
            // stop keyboard animations while pinching
            stopAnimation();
            targetScale = scale;
            targetX = x;
            targetY = y;
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
            targetX = x;
            targetY = y;
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

            // keep targets in sync so animation doesn't fight when pinch ends
            targetScale = scale;
            targetX = x;
            targetY = y;
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
            targetX = x;
            targetY = y;
            targetScale = scale;
            e.preventDefault();
            return;
        }

        // Zoom (+ / -)
        if (e.code === 'Equal' || e.code === 'NumpadAdd') {
            if (!containerRef) return;
            const rect = containerRef.getBoundingClientRect();
            // animated zoom to center
            zoomToPoint(rect.width / 2, rect.height / 2, 0.1, true);
            e.preventDefault();
            return;
        }
        if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
            if (!containerRef) return;
            const rect = containerRef.getBoundingClientRect();
            zoomToPoint(rect.width / 2, rect.height / 2, -0.1, true);
            e.preventDefault();
            return;
        }

        // Arrow keys / WASD for nudging
        const nudgeDistance = e.shiftKey ? 50 : 10;
        let handled = true;

        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                targetX += nudgeDistance;
                startAnimation();
                break;
            case 'ArrowRight':
            case 'KeyD':
                targetX -= nudgeDistance;
                startAnimation();
                break;
            case 'ArrowUp':
            case 'KeyW':
                targetY += nudgeDistance;
                startAnimation();
                break;
            case 'ArrowDown':
            case 'KeyS':
                targetY -= nudgeDistance;
                startAnimation();
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
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            dragging = false;
            spacePressed = false;
            touchPoints.clear();
            document.body.style.cursor = "default";
            stopAnimation();
        }
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

    // Da der Content-Container zoom verwendet, müssen wir die Position
    // der Punkte entsprechend anpassen, damit sie mit dem Content synchron bleiben
    let bgSize = $derived(`${screenSpacing}px ${screenSpacing}px`);
    // Background position should follow the content translation in screen pixels
    // (x,y are screen-space offsets), so don't multiply by scale here.
    let bgPos = $derived(`${x}px ${y}px`);
    let gradient = $derived(`radial-gradient(circle, rgba(0,0,0,${dotOpacity()}) ${dotRadius}px, rgba(0,0,0,0) ${dotRadius + 1}px)`);
    let bgStyle = $derived(`background-image: ${gradient}; background-size: ${bgSize}; background-position: ${bgPos};`);
</script>

<div
        bind:this={containerRef}
        class="canvas-container"
        onwheel={onWheel}
        onpointerdown={onPointerDown}
        onpointermove={onPointerMove}
        onpointerup={onPointerUp}
        onpointercancel={onPointerUp}
>
    <div class="dot-bg" style={bgStyle}></div>

    <!-- Use translate(x,y) then scale(s) so mapping is: screen = world*scale + (x,y).
         This ensures world-to-screen math in zoomToPoint stays valid and the mouse
         remains the center of zoom. -->
    <div class="content relative" style={`transform: translate(${x}px, ${y}px) scale(${scale});`}>
        {@render children?.()}
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
    }

    .dot-bg {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background-color: #f8f9fa;
    }

    .content {
        position: absolute;
        top: 0;
        left: 0;
        transform-origin: 0 0;
    }
</style>