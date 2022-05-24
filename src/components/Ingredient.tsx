import { JSXElement } from "solid-js";
import { Button, Form, Popover } from "solid-bootstrap";
import { createSortable } from "@thisbeyond/solid-dnd";
import "../util/layout.css";

import type { IngredientDef } from "../util/Definitions";

export interface IngredientProps {
    ingredient: IngredientDef;
    onDelete: (id: number) => void;
    onChange: (id: number, newData: any) => void;
    moveIngredient: (from: IngredientDef, to: IngredientDef) => void;
}

const ingredientStyle = {
    border: "solid 2px grey",
    padding: "4px",
    borderRadius: "4px",
    width: "100%",
    height: "3rem",
};

function Ingredient({ ingredient: data, onDelete, onChange, moveIngredient }: IngredientProps): JSXElement {
    const sortable = createSortable(data.id);

    function FullComment(props: any) {
        return <Popover id="popover-basic" content {...props}></Popover>;
    }

    const dragStyle = {
        border: "dashed 2px grey",
        opacity: 0.5,
    };

    return (
        <div
            ref={sortable.ref}
            class="flex flex-row align-center justify-center"
            style={ sortable.isActiveDraggable
                ? { ...ingredientStyle, ...dragStyle }
                : { ...ingredientStyle }
            }
        >
            <div {...sortable.dragActivators} style={{ flex: "none", cursor: "move" }}>
                Drag
            </div>
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
                <Form.Control
                    as="select"
                    value={data.current_unit.id}
                    onInput={(e) => {
                        onChange(
                            data.id,
                            Object.assign(data, {
                                current_unit: data.units.find(u => u.id === Number.parseInt(e.currentTarget.value))
                            })
                        );
                    }}
                >
                    {data.units.map((unit) => (
                        <option value={unit.id}>
                            {unit.short_name} ({unit.long_name})
                        </option>
                    ))}
                </Form.Control>
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
                    D
                </Button>
            </div>
        </div>
    );
};

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

export default Ingredient;
