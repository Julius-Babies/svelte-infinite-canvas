<script>
    import Canvas from "$lib/canvas/Canvas.svelte";

    let zoom = $state(1);
</script>

<div class="w-full h-full flex flex-col">
    <div class="h-16">
        Zoom: {zoom}x
    </div>
    <Canvas
            bind:scale={zoom}
    >
        <div class="w-64 h-32">
            <iframe
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                    class="w-full h-full"
                    style="zoom: {1/zoom}"
            ></iframe><span>Hallo</span>
        </div>
    </Canvas>
</div>
