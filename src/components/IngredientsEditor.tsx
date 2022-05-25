import { batch, createEffect, createSignal, For, JSXElement } from "solid-js";
import { chain, map, none, Option, some, unwrap } from '../util/fp/option';
import Ingredient from "./Ingredient";
import {
    closestCenter,
    createDroppable,
    DragDropProvider,
    DragDropSensors,
    Draggable,
    DragOverlay,
    Droppable,
    SortableProvider,
} from "@thisbeyond/solid-dnd";
import { Card } from "solid-bootstrap";
import styles from "../util/layout.module.css";
import * as IO from "../util/io";

import type { IngredientDef, ProjectDef } from "../util/Definitions";
import { createStore } from "solid-js/store";
import { pipe } from "../util/fp/function";
import { c } from "../util/css";

export interface IngredientsEditorProps {
    project: ProjectDef;
}


const IngredientsEditor: (props: IngredientsEditorProps) => JSXElement =
({ project }) => {

    const [ingredients, setIngredients] = createStore<{ PREPARED: IngredientDef[], NOT_PREPARED: IngredientDef[] }>({
        PREPARED: [],
        NOT_PREPARED: [],
    })

    createEffect(async () => {
        const allIngrs = (await IO.getAllIngredients(project)) || [];
        const normalIngrs = allIngrs.filter(i => !i.prepare);
        const preparedIngrs = allIngrs.filter(i => i.prepare);
        batch(() => {
            setIngredients("PREPARED", preparedIngrs);
            setIngredients("NOT_PREPARED", normalIngrs);
        })
        console.log('ingredients');
        console.log(ingredients);
    });

    const [activeIngredient, setActiveIngredient] = createSignal<number | null>(null);

    function containerIds(): string[] { return Object.keys(ingredients) }

    function isContainer(id: string): boolean { return containerIds().includes(id) }

    function getContainer(id: number): Option<string> {
        for (const [key, items] of (Object.entries(ingredients) as [string, IngredientDef[]][])) {
            if (items.map(i => i.id).includes(id)) {
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

    function closestContainerOrItem<T extends string | number>(draggable: Draggable, droppables: Droppable[], context: DnDContext<T>): Droppable | null {
    const closestContainer = closestCenter(
      draggable,
      droppables.filter((droppable) => chain(getNumberId(droppable.id))(getContainer)),
      context
    );
    if (closestContainer) {
      const containerItemIds = ingredients[closestContainer.id];
      const closestItem = closestCenter(
        draggable,
        droppables.filter((droppable) =>
          containerItemIds.includes(droppable.id)
        ),
        context
      );
      if (!closestItem) {
        return closestContainer;
      }

      if (map(chain(pipe(draggable.id, getNumberId))(getContainer))(containerId => containerId !== closestContainer.id)) {
        const isLastItem =
          containerItemIds.indexOf(closestItem.id) ===
          containerItemIds.length - 1;

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

    function move(draggable: Draggable, droppable: Droppable, onlyWhenChangingContainer = true): void {
    const draggableContainer = chain<number, string>(getNumberId(droppable.id))(getContainer);
    const droppableContainer = typeof droppable.id === 'string'
      ? some(droppable.id)
      : getContainer(droppable.id);

    if (
      draggableContainer != droppableContainer ||
      !onlyWhenChangingContainer
    ) {
      const containerItemIds = ingredients[unwrap(droppableContainer)];
      let index = containerItemIds.indexOf(droppable.id);
      if (index === -1) index = containerItemIds.length;

      batch(() => {
        setIngredients(unwrap(draggableContainer) as any, (items: IngredientDef[]) =>
          items.filter((item) => item.id !== draggable.id)
        );
        setIngredients(unwrap(droppableContainer) as any, (items: IngredientDef[]) => [
          ...items.slice(0, index),
          draggable.id,
          ...items.slice(index),
        ]);
      });
    }
  }


    function onDragStart({ draggable }: { draggable: Draggable | null }): void {
        setActiveIngredient(pipe(getNumberId(draggable.id), unwrap));
    }

    function onDragOver({ draggable, droppable }: { draggable: Draggable | null, droppable: Droppable | null }): void {
        if (draggable && droppable) {
            move(draggable, droppable, false);
        }
    }

    function onDragEnd({ draggable, droppable }: { draggable: Draggable | null, droppable: Droppable | null }): void {
        if (draggable && droppable) {
            move(draggable, droppable, false);
        }
        setActiveIngredient(null);
    }

    function getActiveIngredient(id: number): Option<IngredientDef> {
        return map<string, IngredientDef>(
            pipe(id, getContainer)
        )(cId => ingredients[cId]?.find(i => i.id === id));
    }

    // @ts-ignore
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
                    <div class={c(styles.flex, styles.flexColumn, styles.alignStart)}>
                        <For each={containerIds()}>
                            {key => <Column id={key} ingredients={ingredients[key]} />}
                        </For>
                        <DragOverlay>
                            {unwrap(map<IngredientDef, JSXElement>(pipe(activeIngredient(), getActiveIngredient))(ingr => <Ingredient ingredient={ingr} onDelete={() => {}} onChange={() => {}} moveIngredient={() => {}} />)) ?? <></>}
                        </DragOverlay>
                    </div>
                </DragDropProvider>
            </Card.Body>
        </Card>
    );
};

function Column(props: { id: string, ingredients: IngredientDef[] }): JSXElement {
    const droppable = createDroppable(props.id);
    // @ts-ignore
    return (
        <div ref={droppable.ref} class={c(styles.flexColumn)} classList={{ "!droppable-accept": droppable.isActiveDroppable }}>
            <SortableProvider ids={props.ingredients.map(i => i.id)}>
                <For each={props.ingredients}>
                    {ingredient => <Ingredient ingredient={ingredient} onDelete={() => {
                    }} onChange={() => {
                    }} moveIngredient={() => {
                    }}/>}
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
