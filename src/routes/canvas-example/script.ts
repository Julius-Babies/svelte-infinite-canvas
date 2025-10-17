export interface Rectangle {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
}

export type HandleType = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";