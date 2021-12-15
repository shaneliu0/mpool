/**
 * Learn more about using TypeScript with React Navigation:
 * https://reactnavigation.org/docs/typescript/
 */

 export type RootStackParamList = {
    Root: undefined;
    NotFound: undefined;
  };
  
  export type BottomTabParamList = {
    Schedule: undefined;
    History: undefined;
    Account: undefined;
  };
  
  export type ScheduleParamList = {
    ScheduleScreen: undefined;
    DayScreen: undefined;
    SignUp: undefined;
  };
  
  export type HistoryParamList = {
    HistoryScreen: undefined;
  };
  
  export type AccountParamList = {
    AccountScreen: undefined;
  }
  
  export type ScheduleDay = {
    date: string;
    classType: string;
    status: string;
    classId: string;
  };
  
  export type SlotTip = {
    type: "check" | "cross" | "checkbox" | "info" | "warning";
    displayText: string;
    identifier?: string;
  }
  
  export type TimeSlot = {
    startTime: string | number;
    endTime: string | number;
    availability: string;
    slotId: string;
    signedUp?: TimedStudent[];
    tips?: SlotTip[];
    alreadySignedUp: boolean;
  }
  
  export type Student = {
    studentId: number,
    firstName: string,
    lastName: string,
    mathLevel?: MathLevel | undefined,
    readingLevel?: ReadingLevel | undefined,
  }
  
  export type TimedStudent = {
    student: Student,
    startTime: string,
    endTime: string,
    signUpId: number
  }
  
  export type Option = {
    action: string;
    studentId: number;
    slotId: number;
    boolStr: string;
  }
  
  export type MathLevel =
    "A" |
    "B" |
    "C" |
    "D" |
    "E" |
    "F" |
    "G" |
    "H" |
    "I" |
    "J" |
    "K" |
    "L" |
    "M" |
    "N" |
    "O"
  
  export type LevelNumbers = '1' | '2'
  export type ReadingLevel = `${MathLevel}${LevelNumbers}`;