/** Template slots: M = morning/day, A = afternoon/evening, N = night, O = off. */
export type TemplateSlot = 'M' | 'A' | 'N' | 'O';

export interface ShiftTemplate {
  id: string;
  name: string;
  description: string;
  pattern: TemplateSlot[];
}

export const SLOT_LABELS: Record<TemplateSlot, string> = {
  M: 'Day / Morning',
  A: 'Afternoon / Evening',
  N: 'Night',
  O: 'Off',
};

export const SHIFT_TEMPLATES: ShiftTemplate[] = [
  {
    id: '2m-2n-2o',
    name: '2-2-2',
    description: '2 days, 2 nights, 2 off',
    pattern: ['M', 'M', 'N', 'N', 'O', 'O'],
  },
  {
    id: '2m-2a-2n-2o',
    name: '2-2-2-2',
    description: '2 mornings, 2 afternoons, 2 nights, 2 off',
    pattern: ['M', 'M', 'A', 'A', 'N', 'N', 'O', 'O'],
  },
  {
    id: '4on-4off',
    name: '4-on 4-off',
    description: '4 day shifts, 4 off',
    pattern: ['M', 'M', 'M', 'M', 'O', 'O', 'O', 'O'],
  },
  {
    id: '5on-2off',
    name: '5-on 2-off',
    description: '5 day shifts, 2 off — a standard week',
    pattern: ['M', 'M', 'M', 'M', 'M', 'O', 'O'],
  },
  {
    id: '3on-3off',
    name: '3-on 3-off',
    description: '3 day shifts, 3 off',
    pattern: ['M', 'M', 'M', 'O', 'O', 'O'],
  },
  {
    id: '4d-4n-4o',
    name: '4-4-4',
    description: '4 days, 4 nights, 4 off',
    pattern: ['M', 'M', 'M', 'M', 'N', 'N', 'N', 'N', 'O', 'O', 'O', 'O'],
  },
  {
    id: 'continental',
    name: 'Continental',
    description: '2 days, 2 nights, 2 off, 3 days, 2 nights, 3 off',
    pattern: ['M', 'M', 'N', 'N', 'O', 'O', 'M', 'M', 'M', 'N', 'N', 'O', 'O', 'O'],
  },
  {
    id: 'panama',
    name: 'Panama 2-2-3',
    description: '2 on, 2 off, 3 on, 2 off, 2 on, 3 off',
    pattern: ['M', 'M', 'O', 'O', 'M', 'M', 'M', 'O', 'O', 'M', 'M', 'O', 'O', 'O'],
  },
  {
    id: 'dupont',
    name: 'DuPont',
    description: '4 nights, 3 off, 3 days, 1 off, 3 nights, 3 off, 4 days, 7 off',
    pattern: [
      'N', 'N', 'N', 'N', 'O', 'O', 'O',
      'M', 'M', 'M', 'O',
      'N', 'N', 'N', 'O', 'O', 'O',
      'M', 'M', 'M', 'M', 'O', 'O', 'O', 'O', 'O', 'O', 'O',
    ],
  },
];
