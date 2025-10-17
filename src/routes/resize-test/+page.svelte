<script lang="ts">
    let scale = $state(1);
</script>

<div class="flex flex-col w-full h-full">
    <div class="flex flex-row">
        <input
                class="flex-1"
                bind:value={scale}
                type="range"
                min="0.1"
                max="2"
                step="0.01"
        >
        <span>{scale}</span>
    </div>

    <div class="mt-4">
        Hallo
    </div>
</div>