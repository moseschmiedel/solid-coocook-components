export interface IngredientDef {
    id: number;
    position: number;
    prepare: boolean;
    article: ArticleDef;
    value: number;
    current_unit: UnitDef;
    units: UnitDef[];
    comment: string;
    beingDragged: boolean;
}

export interface ArticleDef {
    name: string,
    comment: string,
}

export interface UnitDef {
    id: number;
    short_name: string;
    long_name: string;
}

export interface ProjectDef {
    type: 'recipe' | 'dish';
    id: number;
    name: string;
    specificId: number;
}