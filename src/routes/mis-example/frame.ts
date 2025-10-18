import type {Position} from "$lib/canvas/position";

export interface Frame {
    id: string;
    position: Position
}

export let initial: Frame[] = [
    {
        id: crypto.randomUUID(),
        position: {
            x: 0,
            y: 0,
            width: 1920,
            height: 1080
        }
    },
    {
        id: crypto.randomUUID(),
        position: {
            x: 1920+500,
            y: 0,
            width: 1920,
            height: 1080
        }
    }
]