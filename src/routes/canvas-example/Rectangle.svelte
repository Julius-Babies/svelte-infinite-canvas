<script lang="ts">
    import type {Rectangle} from "./script";

    let {
        rect = $bindable(),
        isSelected,
        onSelect
    }: {
        rect: Rectangle,
        isSelected: boolean,
        onSelect: (withShift: boolean) => void
    } = $props();
</script>

<button
        onclick={(e) => {
            onSelect(e.shiftKey);
        }}
        aria-label="Auswählen"
        class="w-full h-full relative"
        style="background-color: {rect.color};"
>
    {#if isSelected}
        Auswahl
    {/if}

</button>