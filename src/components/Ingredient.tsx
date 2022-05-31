import { createEffect, JSXElement } from "solid-js";
import { Button, Form } from "solid-bootstrap";
import { BiMoveVertical, BiTrash } from 'solid-icons/bi';
import { createSortable, maybeTransformStyle, useDragDropContext } from "@thisbeyond/solid-dnd";
import styles from "../util/layout.module.css";

import type { IngredientDef, IngredientDefRO } from "../util/Definitions";
import { c } from "../util/css";
import { For } from "solid-js/types/server";
import IngredientsEditor, { IngDnD } from "./IngredientsEditor";

export interface IngredientProps {
    ingredient: IngredientDefRO;
    onDelete: (id: number) => void;
    onChange: (id: number, newData: any) => void;
    moveIngredient: (from: IngredientDefRO, to: IngredientDefRO) => void;
}

const ingredientStyle = {
    border: "solid 2px grey",
    padding: "4px",
    borderRadius: "4px",
    width: "100%",
    height: "3rem",
};

function DraggableIngredient({ ingredient, onDelete, onChange, moveIngredient }: IngredientProps): JSXElement {
    const sortable = createSortable(ingredient.id, { dndType: IngDnD.Ingredient, ingredient });

    return (
        <div
            ref={sortable.ref}
            class={c(styles.flex, styles.flexRow, styles.alignCenter, styles.justifyCenter, styles.ingredient)}
            classList={{ [styles.dragging]: sortable.isActiveDraggable }}
            style={maybeTransformStyle(sortable.transform)}
        >
            <div style={{ flex: "none", cursor: "move" }} {...sortable.dragActivators}>
                <BiMoveVertical size="32px" />
            </div>
            <IngredientDetail
                ingredient={ingredient}
                onDelete={onDelete}
                onChange={onChange}
                moveIngredient={moveIngredient}
            />
        </div>);
}

function Ingredient({ ingredient, onDelete, onChange, moveIngredient }: IngredientProps): JSXElement {
    return (
        <div
            class={c(styles.flex, styles.flexRow, styles.alignCenter, styles.justifyCenter)}
            style={ingredientStyle}
        >
            <div style={{ flex: "none", cursor: "move" }}>
                <BiMoveVertical size="32px" />
            </div>
            <IngredientDetail
                ingredient={ingredient}
                onDelete={onDelete}
                onChange={onChange}
                moveIngredient={moveIngredient}
            />
        </div>);
}

function IngredientDetail({ ingredient: data, onDelete, onChange, moveIngredient }: IngredientProps): JSXElement {

    return (
        <>
            {/* Title */}
            <div style={{ minWidth: "8rem", flex: "none" }}>{data.article.name}</div>
            {/* Value */}
            <div style={{ width: "4.6rem", flex: "none" }}>
                <Form>
                    <Form.Control
                        as="input"
                        type="number"
                        step="any"
                        value={data.value}
                        onInput={(e) => {
                            onChange(
                                data.id,
                                Object.assign(data, {
                                    value: Number.parseFloat(e.currentTarget.value),
                                })
                            );
                        }}
                    />
                </Form>
            </div>
            {/* Unit */}
            <div style={{ width: "6.5rem", flex: "none" }}>
                <Form.Select
                    value={data.current_unit.id}
                    onChange={(e) => {
                        onChange(
                            data.id,
                            Object.assign(data, {
                                current_unit: data.units.find(u => u.id === Number.parseInt(e.currentTarget.value))
                            })
                        );
                    }}
                >
                    {data.units.map(unit =>
                        <option value={unit.id}>
                            {unit.short_name} ({unit.long_name})
                        </option>)}
                </Form.Select>
            </div>
            {/* Comment */}
            {/*<OverlayTrigger delay={{ show: 250, hide: 400 }} overlay={<FullComment>{data.comment}</FullComment>} placement="right">*/}
            <Form.Control as="input" type="text" value={data.comment} onInput={e => onChange(data.id, Object.assign(data, {
                comment: e.currentTarget?.value,
            }))} />
            {/* <div className="ml-truncate" style={{flexGrow: 1, marginLeft: 8, marginRight: 8, height: 'inherit', WebkitLineClamp: 2}}>
                    {data.comment}
                </div> */}
            {/*</OverlayTrigger>*/}
            {/* Delete Button */}
            <div style={{ flex: "none" }}>
                <Button variant="danger" onClick={() => onDelete(data.id)}>
                    <BiTrash size="24px" />
                </Button>
            </div>
        </>
    );
}

export const significantChanges: (changes: Partial<IngredientDef>) => boolean =
changes => {
    const keys = Object.keys(changes);
    if (keys.includes('comment')) return true;
    if (keys.includes('article')) return true;
    if (keys.includes('current_unit')) return true;
    if (keys.includes('position')) return true;
    if (keys.includes('prepare')) return true;
    if (keys.includes('units')) return true;
    if (keys.includes('value')) return true;
    if (keys.includes('id')) return true;

    return false;
}

export {
    Ingredient,
    DraggableIngredient,
};
