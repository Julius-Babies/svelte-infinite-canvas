<script lang="ts">
    import type {Ellipse} from "../component";

    let {
        ellipse
    }: {
        ellipse: Ellipse
    } = $props();
</script>

<svg
        class="absolute"
        style={`width: ${ellipse.position.width}px; height: ${ellipse.position.height}px; top: 0; left: 0; background-color: ${ellipse.color}; border-radius: 50%;`}
>
    <ellipse rx={ellipse.position.width} ry={ellipse.position.height} cx={ellipse.position.width / 2} cy={ellipse.position.height / 2} fill={ellipse.color} />

</svg>