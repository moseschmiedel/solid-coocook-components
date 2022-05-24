import { backend } from '../constants';
import type { IngredientDef, ProjectDef } from './Definitions';


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
        beingDragged: false,
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
        const response: BackendIngredient[] = await (await fetch(`${baseUrl(project)}/ingredients`,
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            })).json();
        const final: IngredientDef[] = response.map(fromBackendFormat);
        console.log('final');
        console.log(final);
        return final;
    } catch(err) {
        console.error(err);
        return null;
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