import { batch, createEffect, createResource, createSignal, For, JSXElement, Show, Suspense } from "solid-js";
import { isNone, isSome, map, none, Option, some } from '../util/fp/option';
import { Ingredient, DraggableIngredient } from "./Ingredient";
import {
    closestCenter,
    createDroppable,
    DragDropProvider,
    DragDropSensors,
    Draggable,
    DragOverlay,
    Droppable, maybeTransformStyle,
    SortableProvider, useDragDropContext,
    DragDropDebugger,
} from "@thisbeyond/solid-dnd";
import { Card } from "solid-bootstrap";
import layoutStyles from "../util/layout.module.css";
import styles from "./IngredientsEditor.module.css";
import * as IO from "../util/io";

import type { IngredientDef, IngredientDefRO, ProjectDef } from "../util/Definitions";
import { createStore } from "solid-js/store";
import { pipe } from "../util/fp/function";
import { c } from "../util/css";

export interface IngredientsEditorProps {
    project: ProjectDef;
}


type IngredientsStore = {
    [container in ContainerID]: IngredientDef[]
};

type IngredientID = number;
type ContainerID = 'PREPARED' | 'NOT_PREPARED';

function isContainerID(string: string): string is ContainerID {
    return ['PREPARED', 'NOT_PREPARED'].includes(string);
}

const IngredientsEditor: (props: IngredientsEditorProps) => JSXElement =
({ project }) => {

    const [ingResource, { refetch: refetchIngredients, mutate: setIngResource }] = createResource(project, (p) => IO.getAllIngredients(p));

    const [ingredients, setIngredients] = createStore<IngredientsStore>({
        PREPARED: [],
        NOT_PREPARED: [],
    })

    createEffect(async () => {
        const allIngrs = ingResource();
        if (allIngrs) {
            const normalIngrs = allIngrs.filter(i => !i.prepare);
            const preparedIngrs = allIngrs.filter(i => i.prepare);
            batch(() => {
                setIngredients("PREPARED", preparedIngrs);
                setIngredients("NOT_PREPARED", normalIngrs);
            })
        }
    });

    const [activeIngredientId, setActiveIngredientId] = createSignal<IngredientID | null>(null);

    function containerIds(): ContainerID[] { return Object.keys(ingredients).filter(isContainerID) }

    function getContainer(id: number): Option<ContainerID> {
        for (const [key, items] of (Object.entries(ingredients) as [string, IngredientDef[]][])) {
            if (items.map(i => i.id).includes(id) && isContainerID(key)) {
                return some(key);
            }
        }
        return none();
    }

    type DnDContext<T> = {
        activeDroppableId: T | null
    }

    function getNumberId(id: string | number): Option<number> {
        if (typeof id === 'string') return none();
        return some(id as number);
    }

    function getStringId(id: string | number): Option<string> {
        if (typeof id === 'number') return none();
        return some(id as string);
    }

    type ContainerDroppable = {
        id: ContainerID,
        data: { dndType: IngDnD.Container },
    } & Droppable;

    type IngredientSortable = {
        id: IngredientID,
        data: {
            dndType: IngDnD.Ingredient,
            ingredient: IngredientDef
        },
    } & Droppable;

    function isContainer(droppable: Droppable): droppable is ContainerDroppable {
        return droppable.data.dndType === IngDnD.Container;
    }

    function isIngredient(sortable: Draggable | Droppable): sortable is IngredientSortable {
        return sortable.data.dndType === IngDnD.Ingredient;
    }

    function closestContainerOrItem<T extends string | number>(draggable: Draggable, droppables: Droppable[], context: DnDContext<T>): Droppable | null {
        if (!isIngredient(draggable)) return null;

        function predicate(id: string | number): boolean {
            return isSome(getStringId(id));
        }

        const closestContainer: Droppable | null = closestCenter(
          draggable,
          droppables.filter(droppable => isContainer(droppable)),
          context
        );

        if (closestContainer && isContainer(closestContainer)) {
            const ingredientsInContainerIds: number[] = ingredients[closestContainer.id]?.map(ingr => ingr.id) ?? [];
            const closestItem: Droppable | null = closestCenter(
                draggable,
                droppables.filter(droppable => isIngredient(droppable) && ingredientsInContainerIds.includes(droppable.id)),
                context);

            if (!closestItem || !isIngredient(closestItem)) {
                return closestContainer;
            }

            if (map<string, boolean>(getContainer(draggable.id))(containerId => containerId !== closestContainer.id).unwrap()) {
                const isLastItem =
                    ingredientsInContainerIds.indexOf(closestItem.id) ===
                    ingredientsInContainerIds.length - 1;

                if (isLastItem) {
                    const belowLastItem =
                        draggable.transformed.center.y > closestItem.transformed.center.y;

                    if (belowLastItem) {
                        return closestContainer;
                    }
                }
            }
            return closestItem;
        }
        return null;
  }

  function move(draggable: Draggable, droppable: Droppable, onlyWhenChangingContainer = true, final = false): void {
        if (!isIngredient(draggable)) return;
        if (!isContainer(droppable) && !isIngredient(droppable)) return;

        const maybeDraggableContainer = getContainer(draggable.id);
        const maybeDroppableContainer = isContainer(droppable) ? some(droppable.id as ContainerID) : getContainer(droppable.id);

        if (isNone(maybeDraggableContainer) || isNone(maybeDroppableContainer)) return;

        const draggableContainer: ContainerID = maybeDraggableContainer.unwrap();
        const droppableContainer: ContainerID = maybeDroppableContainer.unwrap();

        if (draggableContainer !== droppableContainer || !onlyWhenChangingContainer) {
            const containerItemIds = ingredients[droppableContainer].map(i => i.id);
            let index = isIngredient(droppable)
                ? containerItemIds.indexOf(droppable.id)
                : containerIds().length;

            batch(() => {
                setIngredients(draggableContainer,
                        items => items.filter(item => item.id !== draggable.id));
                setIngredients(droppableContainer, items => [
                    ...items.slice(0, index),
                    draggable.data.ingredient,
                    ...items.slice(index),
                ]);
            });

            if (final) {
                setIngResource(prevIngs => prevIngs.map(ing => {
                    let mutIng = { ...ing };
                    if (mutIng.id === draggable.id) {
                        mutIng.prepare = droppableContainer === 'PREPARE';
                    }
                    return mutIng;
                }));
            }
        }
  }


    function onDragStart({ draggable }: { draggable: Draggable | null }): void {
        if (!isIngredient(draggable)) return;
        setActiveIngredientId(draggable.id);
    }

    function onDragOver({ draggable, droppable }: { draggable: Draggable | null, droppable: Droppable | null }): void {
        if (draggable && droppable) {
            move(draggable, droppable);
        }
    }

    function onDragEnd({ draggable, droppable }: { draggable: Draggable | null, droppable: Droppable | null }): void {
        if (draggable && droppable) {
            move(draggable, droppable, false, true);
        }
        setActiveIngredientId(null);
    }

    function getActiveIngredient(id: number): Option<IngredientDefRO> {
        const maybeContainer = getContainer(id);
        if (isNone(maybeContainer)) return none();

        return some(ingredients[maybeContainer.unwrap()].find(i => i.id === id));
    }

    return (
        <Card>
            <Card.Header>
                <h3>Ingredients</h3>
            </Card.Header>
            <Card.Body>
                <DragDropProvider
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDragEnd={onDragEnd}
                    collisionDetector={closestContainerOrItem}
                >
                    <DragDropSensors />
                    <DragDropDebugger />
                    <Suspense fallback={"...loading"}>
                        <div class={c(layoutStyles.flex, layoutStyles.flexColumn, layoutStyles.alignStart)}>
                            <For each={containerIds()}>
                                {key => <Column id={key} ingredients={ingredients[key]} /> }
                            </For>
                            <DragOverlay>
                                <Show when={getActiveIngredient(activeIngredientId()).unwrap() ?? false}>
                                    {activeIngredient =>
                                        <Ingredient
                                            ingredient={activeIngredient}
                                            onDelete={() => {}}
                                            onChange={() => {}}
                                            moveIngredient={() => {}}
                                        />}
                                </Show>
                            </DragOverlay>
                        </div>
                    </Suspense>
                </DragDropProvider>
            </Card.Body>
        </Card>
    );
};

export enum IngDnD {
    Container = 'CONTAINER',
    Ingredient = 'INGREDIENT',
}

function Column(props: { id: string, ingredients: readonly IngredientDefRO[] }): JSXElement {
    const droppable = createDroppable(props.id, { dndType: IngDnD.Container });

    return (
        <div ref={droppable.ref} class={c(layoutStyles.flexColumn, styles.dropContainer)} classList={{ '!droppable-accept': droppable.isActiveDroppable }}>
            <div class={c(styles.listHeader)}>{props.id}</div>
            <SortableProvider ids={props.ingredients.map(i => i.id)}>
                <For each={props.ingredients}>
                    {ingredient => {
                        return <DraggableIngredient
                            ingredient={ingredient}
                            onDelete={() => {}}
                            onChange={() => {}}
                            moveIngredient={() => {}}
                        />}
                    }
                </For>
            </SortableProvider>
        </div>
    )
}

// If `a` comes before `b` return should be negative
const sortByPosition = (a: IngredientDef, b: IngredientDef) =>
    a.position - b.position;

const equalsById = (ingr1: IngredientDef) => (ingr2: IngredientDef) =>
    ingr1.id === ingr2.id;

export default IngredientsEditor;
