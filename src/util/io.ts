import { backend } from '../constants';
import type { IngredientDef, ProjectDef } from './Definitions';
import config from '../../config.json';


const baseUrl: (project: ProjectDef) => string =
project => {
    switch (project.type) {
            case 'dish':
                return `${backend}/project/${project.id}/${project.name}/dish/${project.specificId}`;
            case 'recipe':
                return `${backend}/project/${project.id}/${project.name}/recipe/${project.specificId}`;
    }
};

type BackendIngredient = Omit<IngredientDef, 'beingDragged'>

const fromBackendFormat: (ingredient: BackendIngredient) => IngredientDef =
ingredient => ({
        id: ingredient.id,
        article: ingredient.article,
        comment: ingredient.comment,
        position: ingredient.position,
        prepare: !!ingredient.prepare,
        value: ingredient.value,
        current_unit: ingredient.current_unit,
        units: ingredient.units,
});

const toBackendFormat: (ingredient: Partial<IngredientDef>) => Partial<BackendIngredient> =
ingredient => {
    let result: Partial<BackendIngredient> = {
        id: ingredient.id,
        article: ingredient.article,
        comment: ingredient.comment,
        position: ingredient.position,
        prepare: ingredient.prepare,
        value: ingredient.value,
        current_unit: ingredient.current_unit,
        units: ingredient.units,
    };
    return result;
};

const getAllIngredients: (project: ProjectDef) => Promise<IngredientDef[] | null> =
async project => {
    try {
        if (config.debug) throw new Error();
        const response: BackendIngredient[] = await (await fetch(`${baseUrl(project)}/ingredients`,
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            })).json();
        return response.map(fromBackendFormat);
    } catch(err) {
        console.error(err);
        const initialNonPreparedIngredients: IngredientDef[] = [
            {
                id: 1,
                position: 1,
                prepare: false,
                article: { name: "Oil", comment: '' },
                value: 2,
                current_unit: { id: 1, short_name: 'l', long_name: 'Liter'},
                units: [
                    { id: 1, short_name: 'l', long_name: 'Liter' },
                    { id: 3, short_name: 'kg', long_name: 'Kilogramm' },
                    { id: 4, short_name: 'ml', long_name: 'Milliliter' },
                ],
                comment: "",
            },
            {
                id: 3,
                position: 3,
                prepare: false,
                article: { name: 'Potatoes', comment: '' },
                value: 2,
                current_unit: { id: 1, short_name: 'l', long_name: 'Liter'},
                units: [
                    { id: 1, short_name: 'l', long_name: 'Liter' },
                    { id: 3, short_name: 'kg', long_name: 'Kilogramm' },
                    { id: 4, short_name: 'ml', long_name: 'Milliliter' },
                ],
                comment: "",
            },
            {
                id: 2,
                position: 2,
                prepare: false,
                article: { name: "Zwiebeln", comment: '' },
                value: 4,
                current_unit: { id: 2, short_name: 'pc.', long_name: 'Piece' },
                units: [
                    { id: 2, short_name: 'pc.', long_name: 'Piece' },
                    { id: 1, short_name: 'l', long_name: 'Liter' },
                    { id: 3, short_name: 'kg', long_name: 'Kilogramm' },
                    { id: 4, short_name: 'ml', long_name: 'Milliliter' },
                ],
                comment: '',
            },
        ];
        return initialNonPreparedIngredients;
    }
};

const updateIngredients: (project: ProjectDef, ingredients: IngredientDef[]) => Promise<IngredientDef[] | null> =
async (project, ingredients) => {
    try {
        const response = await fetch(`${baseUrl(project)}/ingredients/updateAll`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ingredients: ingredients.map(toBackendFormat) }),
        });

        return (await response.json()).map(fromBackendFormat);
    } catch (err) {
        return null;
    }
};

type IngredientID = number;

const updateIngredient: (project: ProjectDef, id: IngredientID, changes: Partial<IngredientDef>) => Promise<IngredientDef | null> =
async (project, id, changes) => {
    try {
        const response = await fetch(`${baseUrl(project)}/ingredients/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, changes: toBackendFormat(changes) }),
        });

        return fromBackendFormat(await response.json());
    } catch (err) {
        return null;
    }
};

export {
    getAllIngredients,
    updateIngredients,
    updateIngredient,
};