export const FILTER_TYPE_OPTIONS =
[
    {
        value:'', 
        label: 'All', 
    },
    {
        value: 'name',
        label: 'Name',
    },
        {
        value:'category',
        label: 'Category', 
    },
    {
        value: 'model',
        label: 'Model',
    },
        {
        value: 'price',
        label: 'Price',
    },
];

export const VALID_FILTER_TYPES = new Set ([
    '', 'name', 'category', 'model', 'price',
]);

export const PartFields = [
    {
        key: 'Part Name',
        title: 'Part Name',
        unit: 'Name',
    },
    {
       key: 'Category',
       title: 'Category',
       unit: 'Category',
    },
    {
        key: 'Brand',
        title: 'Brand',
        unit: 'Brand',
    },
    {
        key: 'Price ($)',
        title: 'Price',
        unit: 'USD',
    },
];