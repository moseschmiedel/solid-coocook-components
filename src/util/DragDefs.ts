import type { IngredientDef } from "./Definitions";
import type { Draggable as LibDraggable, Droppable as LibDroppable } from "@thisbeyond/solid-dnd";

export const DragTypes = {
    Ingredient: "INGREDIENT",
};

export interface DragIngredient {
    id: number;
    type: string;
    ingredient: IngredientDef;
}

export type Draggable<T extends number | string> = 
LibDraggable & {
    id: T
}

export type Droppable<T extends number | string> = 
LibDroppable & {
    id: T
}