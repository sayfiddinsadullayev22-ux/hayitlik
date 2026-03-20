export type SectionType = 'iq' | 'math' | 'english';

export interface Question {
  id: number;
  correctAnswer: string;
}

export interface Section {
  id: SectionType;
  title: string;
  duration: number; // in minutes
  questions: Question[];
  images: string[];
}

export interface UserAnswer {
  sectionId: SectionType;
  questionId: number;
  answer: string;
}

export interface TestState {
  status: 'idle' | 'instructions' | 'testing' | 'results';
  currentSection: SectionType;
  answers: UserAnswer[];
  startTime: number | null;
  endTime: number | null;
}
