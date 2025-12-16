export interface State {
  code: string;
  name: string;
  isActive: boolean;
}

export const states: State[] = [
  {
    code: '01',
    name: 'Jammu and Kashmir',
    isActive: true,
  },
  {
    code: '02',
    name: 'Himachal Pradesh',
    isActive: true,
  },
  {
    code: '03',
    name: 'Punjab',
    isActive: true,
  },
  {
    code: '04',
    name: 'Chandigarh',
    isActive: true,
  },
  {
    code: '05',
    name: 'Uttarakhand',
    isActive: true,
  },
  {
    code: '06',
    name: 'Haryana',
    isActive: true,
  },
  {
    code: '07',
    name: 'Delhi',
    isActive: true,
  },
  {
    code: '08',
    name: 'Rajasthan',
    isActive: true,
  },
  {
    code: '09',
    name: 'Uttar Pradesh',
    isActive: true,
  },
  {
    code: '10',
    name: 'Bihar',
    isActive: true,
  },
  {
    code: '11',
    name: 'Sikkim',
    isActive: true,
  },
  {
    code: '12',
    name: 'Arunachal Pradesh',
    isActive: true,
  },
  {
    code: '13',
    name: 'Nagaland',
    isActive: true,
  },
  {
    code: '14',
    name: 'Manipur',
    isActive: true,
  },
  {
    code: '15',
    name: 'Mizoram',
    isActive: true,
  },
  {
    code: '16',
    name: 'Tripura',
    isActive: true,
  },
  {
    code: '17',
    name: 'Meghalaya',
    isActive: true,
  },
  {
    code: '18',
    name: 'Assam',
    isActive: true,
  },
  {
    code: '19',
    name: 'West Bengal',
    isActive: true,
  },
  {
    code: '20',
    name: 'Jharkhand',
    isActive: true,
  },
  {
    code: '21',
    name: 'Odisha',
    isActive: true,
  },
  {
    code: '22',
    name: 'Chhattisgarh',
    isActive: true,
  },
  {
    code: '23',
    name: 'Madhya Pradesh',
    isActive: true,
  },
  {
    code: '24',
    name: 'Gujarat',
    isActive: true,
  },
  {
    code: '26',
    name: 'Dadra and Nagar Haveli and Daman and Diu',
    isActive: true,
  },
  {
    code: '27',
    name: 'Maharashtra',
    isActive: true,
  },
  {
    code: '29',
    name: 'Karnataka',
    isActive: true,
  },
  {
    code: '30',
    name: 'Goa',
    isActive: true,
  },
  {
    code: '32',
    name: 'Kerala',
    isActive: true,
  },
  {
    code: '33',
    name: 'Tamil Nadu',
    isActive: true,
  },
  {
    code: '34',
    name: 'Puducherry',
    isActive: true,
  },
  {
    code: '35',
    name: 'Andaman and Nicobar Islands',
    isActive: true,
  },
  {
    code: '36',
    name: 'Telangana',
    isActive: true,
  },
  {
    code: '37',
    name: 'Andhra Pradesh',
    isActive: true,
  },
  {
    code: '38',
    name: 'Ladakh',
    isActive: true,
  },
];

export function getStateByCode(code: string): State {
  const state = states.find((state) => state.code === code && state.isActive);
  if (!state) {
    throw new Error(`State with code ${code} not found`);
  }
  return state;
}

export const stateOptions = states
  .filter((state) => state.isActive)
  .map((state) => ({
    label: `${state.name} (${state.code})`,
    value: state.code,
  }));
