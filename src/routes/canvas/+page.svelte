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

            <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1624.8537607753653!2d13.735441125728101!3d50.985412506109085!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sde!2sde!4v1760707331053!5m2!1sde!2sde" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
    </Canvas>
</div>
