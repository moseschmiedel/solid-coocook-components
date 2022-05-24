const contains: (list: Array<any>) => (equals: (elem: any) => boolean) => boolean = 
(list: Array<any>) => (equals: (elem: any) => boolean) => list.filter(equals).length > 0;

export {
    contains
};
