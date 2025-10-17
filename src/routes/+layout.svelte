<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
    import {onMount} from "svelte";
    import {isCtrlPressed, isMetaPressed, isShiftPressed} from "$lib/state/keyboard";
	
	let { children } = $props();

    function onKeyDown(e: KeyboardEvent) {
        if (e.key === "Shift") isShiftPressed.set(true);
        if (e.key === "Ctrl") isCtrlPressed.set(true)
        if (e.key === "Meta") isMetaPressed.set(true)
    }

    function onKeyUp(e: KeyboardEvent) {
        if (e.key === "Shift") isShiftPressed.set(false);
        if (e.key === "Ctrl") isCtrlPressed.set(false)
        if (e.key === "Meta") isMetaPressed.set(false)
    }

    onMount(() => {
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("keyup", onKeyUp);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("keyup", onKeyUp);
        }
    })
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex flex-col h-dvh w-dvw">
    {@render children?.()}
</div>
