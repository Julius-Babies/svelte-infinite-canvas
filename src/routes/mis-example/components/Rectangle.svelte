<script lang="ts">
    import type {Rectangle} from "../component";

    let {
        rectangle
    }: {
        rectangle: Rectangle
    } = $props();
</script>

<div
        class="absolute"
        style={`width: ${rectangle.position.width}px; height: ${rectangle.position.height}px; top: 0; left: 0; background-color: ${rectangle.color};`}
>

</div>