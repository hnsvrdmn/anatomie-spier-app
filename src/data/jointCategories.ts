import { JointCategory } from '../types/anatomy';

export const JOINT_CATEGORIES: JointCategory[] = [
  {
    id: 'coxae',
    code: 'A',
    name: 'Art. COXAE',
    pageInfo: 'Heupgewricht',
    title: 'Art. COXAE (Heupgewricht)',
    muscleIds: [
      'rectus_femoris',
      'biceps_femoris',
      'semimembranosus',
      'semitendinosus',
      'tensor_fasciae_latae',
      'iliopsoas',
      'gluteus_medius',
      'adductores',
      'gluteus_maximus'
    ]
  },
  {
    id: 'genus',
    code: 'B',
    name: 'Art. GENUS',
    pageInfo: 'Kniegewricht',
    title: 'Art. GENUS (Kniegewricht)',
    muscleIds: [
      'rectus_femoris',
      'vastus_lateralis',
      'vastus_intermedius',
      'vastus_medialis',
      'biceps_femoris',
      'semimembranosus',
      'semitendinosus'
    ]
  },
  {
    id: 'pedis',
    code: 'C',
    name: 'Art. PEDIS',
    pageInfo: 'Enkelgewrichten',
    title: 'Art. PEDIS (Enkelgewrichten)',
    muscleIds: [
      'tibialis_anterior',
      'fibularis_brevis',
      'fibularis_longus',
      'gastrocnemius',
      'soleus'
    ]
  },
  {
    id: 'cubiti',
    code: 'D',
    name: 'Art. CUBITI',
    pageInfo: 'Ellebooggewricht',
    title: 'Art. CUBITI (Ellebooggewricht)',
    muscleIds: [
      'biceps_brachii',
      'brachialis',
      'triceps_brachii'
    ]
  },
  {
    id: 'humeri',
    code: 'E',
    name: 'Art. HUMERI',
    pageInfo: 'Schoudergewricht',
    title: 'Art. HUMERI (Schoudergewricht)',
    muscleIds: [
      'latissimus_dorsi',
      'deltoideus',
      'pectoralis_major',
      'teres_major',
      'teres_minor'
    ]
  },
  {
    id: 'cingulum',
    code: 'F',
    name: 'CINGULUM PECTORALE',
    pageInfo: 'Schoudergordel',
    title: 'CINGULUM PECTORALE (Schoudergordel)',
    muscleIds: [
      'latissimus_dorsi',
      'trapezius',
      'levator_scapulae',
      'serratus_anterior',
      'rhomboidei'
    ]
  },
  {
    id: 'romp',
    code: 'G',
    name: 'ROMP / WERVELKOLOM',
    pageInfo: 'Romp en Wervelkolom',
    title: 'ROMP / WERVELKOLOM',
    muscleIds: [
      'rectus_abdominis',
      'obliquus_internus_abdominis',
      'obliquus_externus_abdominis',
      'erector_spinae',
      'iliopsoas'
    ]
  }
];

export function getJointCategory(id: string): JointCategory | undefined {
  return JOINT_CATEGORIES.find((cat) => cat.id === id);
}
