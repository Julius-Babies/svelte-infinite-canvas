import {writable} from "svelte/store";

export const isShiftPressed = writable(false)
export const isCtrlPressed = writable(false)
export const isMetaPressed = writable(false)