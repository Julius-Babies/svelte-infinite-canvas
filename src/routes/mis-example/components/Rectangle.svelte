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
        style={`width: 100%; height: 100%; top: 0; left: 0; background-color: ${rectangle.color};`}
>

</div>