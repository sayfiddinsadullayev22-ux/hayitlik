import { Section } from './types';

export const SECTIONS: Section[] = [
  {
    id: 'iq',
    title: 'IQ Mock-1',
    duration: 20,
    images: [
      '/images/iq_page1.jpg',
      '/images/iq_page2.jpg',
      '/images/iq_page3.jpg',
      '/images/iq_page4.jpg',
      '/images/iq_page5.jpg',
      '/images/iq_page6.jpg',
    ],
    questions: [
      { id: 1, correctAnswer: 'c' }, { id: 2, correctAnswer: 'a' }, { id: 3, correctAnswer: 'd' }, { id: 4, correctAnswer: 'c' },
      { id: 5, correctAnswer: 'b' }, { id: 6, correctAnswer: 'a' }, { id: 7, correctAnswer: 'c' }, { id: 8, correctAnswer: 'b' },
      { id: 9, correctAnswer: 'd' }, { id: 10, correctAnswer: 'c' }, { id: 11, correctAnswer: 'b' }, { id: 12, correctAnswer: 'a' },
      { id: 13, correctAnswer: 'b' }, { id: 14, correctAnswer: 'c' }, { id: 15, correctAnswer: 'd' }, { id: 16, correctAnswer: 'd' },
      { id: 17, correctAnswer: 'c' }, { id: 18, correctAnswer: 'b' }, { id: 19, correctAnswer: 'a' }, { id: 20, correctAnswer: 'c' },
    ],
  },
  {
    id: 'math',
    title: 'Mathematics',
    duration: 40,
    images: [
      '/images/math_page1.jpg',
      '/images/math_page2.jpg',
      '/images/math_page3.jpg',
      '/images/math_page4.jpg',
    ],
    questions: [
      { id: 1, correctAnswer: 'c' }, { id: 2, correctAnswer: 'd' }, { id: 3, correctAnswer: 'c' }, { id: 4, correctAnswer: 'c' },
      { id: 5, correctAnswer: 'b' }, { id: 6, correctAnswer: 'b' }, { id: 7, correctAnswer: 'a' }, { id: 8, correctAnswer: 'a' },
      { id: 9, correctAnswer: 'b' }, { id: 10, correctAnswer: 'd' }, { id: 11, correctAnswer: 'c' }, { id: 12, correctAnswer: 'd' },
      { id: 13, correctAnswer: 'b' }, { id: 14, correctAnswer: 'a' }, { id: 15, correctAnswer: 'd' }, { id: 16, correctAnswer: 'a' },
      { id: 17, correctAnswer: 'b' }, { id: 18, correctAnswer: 'b' }, { id: 19, correctAnswer: 'a' }, { id: 20, correctAnswer: 'd' },
    ],
  },
  {
    id: 'english',
    title: 'English',
    duration: 40,
    images: [
      '/images/english_page1.jpg',
      '/images/english_page2.jpg',
      '/images/english_page3.jpg',
      '/images/english_page4.jpg',
      '/images/english_page5.jpg',
    ],
    questions: [
      { id: 1, correctAnswer: 'b' }, { id: 2, correctAnswer: 'a' }, { id: 3, correctAnswer: 'b' }, { id: 4, correctAnswer: 'b' },
      { id: 5, correctAnswer: 'b' }, { id: 6, correctAnswer: 'd' }, { id: 7, correctAnswer: 'a' }, { id: 8, correctAnswer: 'c' },
      { id: 9, correctAnswer: 'd' }, { id: 10, correctAnswer: 'c' }, { id: 11, correctAnswer: 'a' }, { id: 12, correctAnswer: 'd' },
      { id: 13, correctAnswer: 'b' }, { id: 14, correctAnswer: 'a' }, { id: 15, correctAnswer: 'a' }, { id: 16, correctAnswer: 'c' },
      { id: 17, correctAnswer: 'b' }, { id: 18, correctAnswer: 'b' }, { id: 19, correctAnswer: 'd' }, { id: 20, correctAnswer: 'b' },
    ],
  },
];
