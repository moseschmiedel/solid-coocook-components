import { createEffect, createSignal, Setter, JSXElement, For } from "solid-js";
import * as List from "../util/List";
import { Option, some, none, chain, map, isSome, unwrap } from '../util/fp/option';
import Ingredient, { significantChanges } from "./Ingredient";
import {
    Draggable,
    Droppable,
    DragDropProvider,
    DragDropSensors,
    DragOverlay,
    SortableProvider,
    createSortable,
    createDroppable,
    closestCenter,
} from "@thisbeyond/solid-dnd";
import { Card } from "solid-bootstrap";
import styles from "./IngredientsEditor.module.css";
import "../util/layout.css";
import * as IO from "../util/io";

import type { IngredientDef, ProjectDef } from "../util/Definitions";
import { batch } from "solid-js";
import { createStore } from "solid-js/store";
import { pipe } from "../util/fp/function";

export interface IngredientsEditorProps {
    project: ProjectDef;
}


const IngredientsEditor: (props: IngredientsEditorProps) => JSXElement =
({ project }) => {

    const [nPIngredients, setNPIngredients] = createSignal<IngredientDef[]>([]);
    const [pIngredients, setPIngredients] = createSignal<IngredientDef[]>([]);

    const fetchIngredients: () => Promise<void> =
    async () => {
        const allIngrs = (await IO.getAllIngredients(project)) || [];
        const normalIngrs = allIngrs.filter(i => !i.prepare);
        const preparedIngrs = allIngrs.filter(i => i.prepare);
        setNPIngredients(normalIngrs);
        setPIngredients(preparedIngrs);
    };

    createEffect(() => {
        fetchIngredients();
    });


    const removeIngredient =
        (id: number) => {
            setNPIngredients((prevState: IngredientDef[]) =>
                prevState.filter((elem: IngredientDef) => elem.id !== id)
            );
            setPIngredients((prevState: IngredientDef[]) =>
                prevState.filter((elem: IngredientDef) => elem.id !== id)
            );
        };

    const updateIngredient =
        async (id: number, newData: Partial<IngredientDef>) => {

            setNPIngredients(prevState =>
                prevState.map(elem => elem.id === id ? { ...elem, ...newData } : elem) );

            setPIngredients(prevState =>
                prevState.map(elem => elem.id === id ? { ...elem, ...newData } : elem) );

            if (significantChanges(newData))
                await IO.updateIngredient(project, id, newData);
        };

    enum IngredientMoveDirection {
        PreparedToPrepared,
        PreparedToNotPrepared,
        NotPreparedToPrepared,
        NotPreparedToNotPrepared,
        NoMovement
    }

    const calculateMoveDirection: (source: IngredientDef, target: IngredientDef) => IngredientMoveDirection =
    (source, target) => {
        const nPContainsSource = List.contains(nPIngredients())(equalsById(source));
        const nPContainsTarget = List.contains(nPIngredients())(equalsById(target));
        const pContainsSource = List.contains(pIngredients())(equalsById(source));
        const pContainsTarget = List.contains(pIngredients())(equalsById(target));
        if (nPContainsSource && nPContainsTarget) {
            return IngredientMoveDirection.NotPreparedToNotPrepared;
        } else
        if (pContainsSource && pContainsTarget) {
            return IngredientMoveDirection.PreparedToPrepared;
        } else
        if (nPContainsSource && pContainsTarget) {
            return IngredientMoveDirection.NotPreparedToPrepared;
        } else
        if (pContainsSource && nPContainsTarget) {
            return IngredientMoveDirection.PreparedToNotPrepared;
        } else {
            // should never be called but typescript complains about it
            return IngredientMoveDirection.NoMovement;
        }
    }

    const moveIngredient = 
        (source: IngredientDef, target: IngredientDef) => {
            const direction = calculateMoveDirection(source, target);
            switch(direction) {
                case IngredientMoveDirection.NoMovement:
                    // As first, because we don't need to check anything else then
                    return;
                case IngredientMoveDirection.NotPreparedToNotPrepared:
                    moveInList(setNPIngredients, source, target, (elem, otherElem) => ({
                        ...elem,
                        ...{
                            position: otherElem.position,
                            prepare: false,
                        }
                    }));
                break;
                case IngredientMoveDirection.PreparedToPrepared:
                    moveInList(setPIngredients, source, target, (elem, otherElem) => ({
                        ...elem,
                        ...{
                            position: otherElem.position,
                            prepare: true,
                        }
                    }));
                break;
                case IngredientMoveDirection.PreparedToNotPrepared:
                /**
                 * We want to put an Ingredient from the prepared Ingredients List in the not prepared List,
                 * to do this we need to find the place in nPIngredients, where the Ingredient should be inserted
                 * and increase the position of all Ingredients that come after that position
                 * The `prepare` property of the ingredient must be updated because, the ingredient is now not prepared
                 */
                    source.prepare = false;
                    removeIngredient(source.id);
                    setNPIngredients(prevState => {
                        let result = increasePositionWithPredicate(prevState, elem => elem.position >= target.position);
                        result = insertIntoList(result, target.position, source);
                        return result.sort(sortByPosition);
                    });
                break;
                case IngredientMoveDirection.NotPreparedToPrepared:
                /**
                 * We want to put an Ingredient from the prepared Ingredients List in the not prepared List,
                 * to do this we need to find the place in nPIngredients, where the Ingredient should be inserted
                 * and increase the position of all Ingredients that come after that position
                 * The `prepare` property of the ingredient must be updated because, the ingredient is now prepared
                 */
                    source.prepare = true;
                    removeIngredient(source.id);
                    setPIngredients(prevState => {
                        let result = increasePositionWithPredicate(prevState, elem => elem.position >= target.position);
                        result = insertIntoList(result, target.position, source);
                        return result.sort(sortByPosition);
                    });
                break;
            }
        };

    function moveInList (set: Setter<IngredientDef[]>, source: IngredientDef, target: IngredientDef, transform: (elem: IngredientDef, otherElem: IngredientDef) => IngredientDef) {
        set(prevState =>
            prevState
                .map(elem => {
                    if (elem.position === source.position) {
                        return transform(elem, target);
                    } else if (elem.position === target.position) {
                        return transform(elem, source);
                    } else {
                        return elem;
                    }
                })
                .sort(sortByPosition)
        );
    }

    const insertIntoList: (list: IngredientDef[], position: number, elem: IngredientDef) => IngredientDef[] =
    (list, position, elem) => list.concat([ { ...elem, ...{ position } } ]);

    const increasePositionWithPredicate: (list: IngredientDef[], predicate: (elem: IngredientDef) => boolean) => IngredientDef[] =
    (list, predicate) => list.map(ingr => predicate(ingr) ? { ...ingr, ...{ position: ingr.position + 1 } } : ingr);


    const appendIngredientPrepared = (
        droppedIngredient: IngredientDef
    ) => {
            removeIngredient(droppedIngredient.id);
            setPIngredients((prevState) =>
                prevState.concat([
                    {
                        ...droppedIngredient,
                        ...{ position: prevState.length+1, prepare: true },
                    },
                ])
            );
    };
    const prependIngredientPrepared = (
        droppedIngredient: IngredientDef
    ) => {
            removeIngredient(droppedIngredient.id);
            setPIngredients((prevState) => {
                let newState: IngredientDef[] =
                    prevState.map((elem: IngredientDef) => ({...elem, ...{ position: elem.position+1 }}));
                return [
                    {
                        ...droppedIngredient,
                        ...{ position: prevState.length, prepare: true },
                    },
                ].concat(newState);
            }
            );
    };

    const appendIngredientNotPrepared = (
        droppedIngredient: IngredientDef
    ) => {
            removeIngredient(droppedIngredient.id);
            setNPIngredients((prevState) =>
                prevState.concat([
                    {
                        ...droppedIngredient,
                        ...{ position: prevState.length+1, prepare: false },
                    },
                ])
            );
        IO.updateIngredient(project, droppedIngredient.id, { position: nPIngredients.length, prepare: false }).then();
    };
    const prependIngredientNotPrepared = (
        droppedIngredient: IngredientDef
    ) => {
            removeIngredient(droppedIngredient.id);
            setNPIngredients((prevState) => {
                let newState: IngredientDef[] =
                    prevState.map((elem: IngredientDef) => ({...elem, ...{ position: elem.position+1 }}));
                return [
                    {
                        ...droppedIngredient,
                        ...{ position: prevState.length, prepare: true },
                    },
                ].concat(newState);
            }
            );
    };

    const [ingredients, setIngredients] = createStore<{ PREPARED: IngredientDef[], NOT_PREPARED: IngredientDef[] }>({
        PREPARED: [],
        NOT_PREPARED: [],
    })

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
      ? droppable.id
      : getContainer(droppable.id);

    if (
      draggableContainer != droppableContainer ||
      !onlyWhenChangingContainer
    ) {
      const containerItemIds = ingredients[droppableContainer];
      let index = containerItemIds.indexOf(droppable.id);
      if (index === -1) index = containerItemIds.length;

      batch(() => {
        setIngredients(draggableContainer, (items: IngredientDef[]) =>
          items.filter((item) => item.id !== draggable.id)
        );
        setIngredients(droppableContainer, (items: IngredientDef[]) => [
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

    function getActiveIngredient(id: number): IngredientDef {
        return pipe(
            id,
            getContainer,
                cId => ingredients[unwrap(cId)].find(i => i.id === id)
        );
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
                    <div
                        class="flex flex-column align-start"
                        id="ingredients-editor"
                    >
                        <For each={containerIds()}>
                            {key => <Column id={key} ingredients={ingredients[key]} />}
                        </For>
                        <DragOverlay>
                            <Ingredient ingredient={pipe(activeIngredient(), getActiveIngredient)} onDelete={() => {}} onChange={() => {}} moveIngredient={() => {}} />
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
        <div ref={droppable.ref} class="column" classList={{ "!droppable-accept": droppable.isActiveDroppable }}>
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
