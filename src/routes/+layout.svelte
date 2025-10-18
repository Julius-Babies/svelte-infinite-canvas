<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
    import {onMount} from "svelte";
    import {isCtrlPressed, isMetaPressed, isShiftPressed} from "$lib/state/keyboard";
    import {mouse} from "$lib/state/mouse";
	
	let { children } = $props();

    function onKeyDown(e: KeyboardEvent) {
        if (e.key === "Shift") isShiftPressed.set(true);
        if (e.key === "Control") isCtrlPressed.set(true)
        if (e.key === "Meta") isMetaPressed.set(true)
    }

    function onKeyUp(e: KeyboardEvent) {
        if (e.key === "Shift") isShiftPressed.set(false);
        if (e.key === "Control") isCtrlPressed.set(false)
        if (e.key === "Meta") isMetaPressed.set(false)
    }

    function onMouseMove(e: MouseEvent) {
        mouse.set({ x: e.clientX, y: e.clientY })
    }

    onMount(() => {
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("keyup", onKeyUp);
        document.addEventListener("mousemove", onMouseMove);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("keyup", onKeyUp);
            document.removeEventListener("mousemove", onMouseMove);
        }
    })
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex flex-col h-dvh w-dvw">
    {@render children?.()}
</div>
