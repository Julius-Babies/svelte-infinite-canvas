import type {Position} from "$lib/canvas/position";

export function getOverlap(positionA: Position, positionB: Position): boolean {
    const nwAinB = positionA.x >= positionB.x && positionA.x <= positionB.x + positionB.width &&
        positionA.y >= positionB.y && positionA.y <= positionB.y + positionB.height;
    const neAinB = positionA.x + positionA.width >= positionB.x && positionA.x + positionA.width <= positionB.x + positionB.width &&
        positionA.y >= positionB.y && positionA.y <= positionB.y + positionB.height;
    const swAinB = positionA.x >= positionB.x && positionA.x <= positionB.x + positionB.width &&
        positionA.y + positionA.height >= positionB.y && positionA.y + positionA.height <= positionB.y + positionB.height;
    const seAinB = positionA.x + positionA.width >= positionB.x && positionA.x + positionA.width <= positionB.x + positionB.width &&
        positionA.y + positionA.height >= positionB.y && positionA.y + positionA.height <= positionB.y + positionB.height;

    return nwAinB || neAinB || swAinB || seAinB;
}