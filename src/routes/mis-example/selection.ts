import {writable} from "svelte/store";
import type {Component} from "./component";

export let selectedComponents = writable<Component[]>([]);

export function onSelect(component: Component | null, withShift: boolean) {
    if (!component) {
        selectedComponents.set([]);
        return;
    }

    if (withShift) {
        selectedComponents.update(value => {
            if (value.includes(component)) {
                return value.filter(c => c !== component);
            } else {
                return [...value, component];
            }
        });
    } else {
        selectedComponents.set([component]);
    }
}