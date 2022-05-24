import "solid-js";
import { render } from 'solid-js/web';
import './index.css';

import type { ProjectDef } from './util/Definitions';
import IngredientsEditor from "./components/IngredientsEditor";

const project: ProjectDef = {
    // @ts-ignore
    type: ingredientsEditorData.dish_id ? 'dish' : 'recipe',
    // @ts-ignore
    id: ingredientsEditorData.project_id,
    // @ts-ignore
    name: ingredientsEditorData.project_name,
    // @ts-ignore
    specificId: ingredientsEditorData.dish_id || ingredientsEditorData.recipe_id,
}

render(() => <IngredientsEditor project={project}/>, document.getElementById('ingredients-editor') as Node);