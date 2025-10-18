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
        style={`width: 100%; height: 100%; top: 0; left: 0;`}
>
    <ellipse rx={Math.abs(ellipse.position.width) / 2} ry={Math.abs(ellipse.position.height) / 2} cx={Math.abs(ellipse.position.width) / 2} cy={Math.abs(ellipse.position.height) / 2} fill={ellipse.color} />

</svg>