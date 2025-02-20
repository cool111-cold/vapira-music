export const Colors = {
    primary: '#000',
    default: '#fff',
    bodyfont: '#BABABA',
    grey: '#D7D7D7',
    header: '#2F2E2E',
    none: 'transparent',
    shadow: '#00000082'
}

export type ColorOptions = typeof Colors[keyof typeof Colors];