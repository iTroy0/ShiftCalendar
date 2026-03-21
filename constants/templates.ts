export interface ShiftTemplate {
  id: string;
  name: string;
  description: string;
  pattern: string[]; // shift codes per day
  cycleDays: number;
}

export const SHIFT_TEMPLATES: ShiftTemplate[] = [
  {
    id: '2m-2n-2o',
    name: '2-2-2',
    description: '2 Morning, 2 Night, 2 Off',
    pattern: ['M', 'M', 'N', 'N', 'O', 'O'],
    cycleDays: 6,
  },
  {
    id: '2m-2a-2n-2o',
    name: '2-2-2-2',
    description: '2 Morning, 2 Afternoon, 2 Night, 2 Off',
    pattern: ['M', 'M', 'A', 'A', 'N', 'N', 'O', 'O'],
    cycleDays: 8,
  },
  {
    id: '4on-4off',
    name: '4-on 4-off',
    description: '4 Day shifts, 4 Off',
    pattern: ['M', 'M', 'M', 'M', 'O', 'O', 'O', 'O'],
    cycleDays: 8,
  },
  {
    id: '5on-2off',
    name: '5-on 2-off',
    description: '5 Day shifts, 2 Off (standard week)',
    pattern: ['M', 'M', 'M', 'M', 'M', 'O', 'O'],
    cycleDays: 7,
  },
  {
    id: '3on-3off',
    name: '3-on 3-off',
    description: '3 Day shifts, 3 Off',
    pattern: ['M', 'M', 'M', 'O', 'O', 'O'],
    cycleDays: 6,
  },
  {
    id: 'continental',
    name: 'Continental',
    description: '2M, 2N, 2O, 3M, 2N, 3O',
    pattern: ['M', 'M', 'N', 'N', 'O', 'O', 'M', 'M', 'M', 'N', 'N', 'O', 'O', 'O'],
    cycleDays: 14,
  },
  {
    id: 'panama',
    name: 'Panama 2-2-3',
    description: '2M, 2O, 3M, 2O, 2M, 3O',
    pattern: ['M', 'M', 'O', 'O', 'M', 'M', 'M', 'O', 'O', 'N', 'N', 'O', 'O', 'O'],
    cycleDays: 14,
  },
];
