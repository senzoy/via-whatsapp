export const robItems = [
    {
        id: 'cuerda',
        name: 'Cuerda',
        description: 'Amarra a la víctima para que no pueda cancelar el robo.',
        price: 1000000,
        blockMessage: '⛓️ Estás amarrado con una cuerda. No puedes cancelar el robo.',
    },
    {
        id: 'cloroformo',
        name: 'Cloroformo',
        description: 'Duerme a la víctima para que no pueda defenderse.',
        price: 2500000,
        blockMessage: '💤 Estás dormido por el cloroformo. No puedes cancelar el robo.',
    },
    {
        id: 'mordaza',
        name: 'Mordaza',
        description: 'Amordaza a la víctima para que no pueda gritar.',
        price: 5000000,
        blockMessage: '😶 Estás amordazado. No puedes cancelar el robo.',
    },
];
export function getRobItem(id) {
    return robItems.find(item => item.id === id);
}
