export interface IngredientDef {
    id: number;
    position: number;
    prepare: boolean;
    article: ArticleDef;
    value: number;
    current_unit: UnitDef;
    units: UnitDef[];
    comment: string;
}

export interface IngredientDefRO {
    readonly id: number;
    readonly position: number;
    readonly prepare: boolean;
    readonly article: ArticleDefRO;
    readonly value: number;
    readonly current_unit: UnitDefRO;
    readonly units: readonly UnitDefRO[]
    readonly comment: string;
}


export interface ArticleDef {
    name: string,
    comment: string,
}
export interface ArticleDefRO {
    readonly name: string,
    readonly comment: string,
}

export interface UnitDef {
    id: number;
    short_name: string;
    long_name: string;
}
export interface UnitDefRO {
    readonly id: number;
    readonly short_name: string;
    readonly long_name: string;
}

export interface ProjectDef {
    type: 'recipe' | 'dish';
    id: number;
    name: string;
    specificId: number;
}