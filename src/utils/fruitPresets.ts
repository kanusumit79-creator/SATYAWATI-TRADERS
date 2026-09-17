import { UnitType } from '../types';

export interface FruitPreset {
  nameNepali: string;
  nameEnglish: string;
  emoji: string;
  defaultUnit: UnitType;
}

export const COMMON_FRUIT_PRESETS: FruitPreset[] = [
  { nameNepali: 'अम्बा (सानो)', nameEnglish: 'Guava (Small)', emoji: '🍈', defaultUnit: 'क्यारेट' },
  { nameNepali: 'अम्बा (ठूलो)', nameEnglish: 'Guava (Big)', emoji: '🍐', defaultUnit: 'क्यारेट' },
  { nameNepali: 'किवी', nameEnglish: 'Kiwi', emoji: '🥝', defaultUnit: 'कार्टुन' },
  { nameNepali: 'मेवा', nameEnglish: 'Papaya', emoji: '🍈', defaultUnit: 'क्यारेट' },
  { nameNepali: 'ड्र्यागन फ्रुट', nameEnglish: 'Dragon Fruit', emoji: '🌺', defaultUnit: 'कार्टुन' },
  { nameNepali: 'स्याउ', nameEnglish: 'Apple / Syau', emoji: '🍎', defaultUnit: 'कार्टुन' },
  { nameNepali: 'केरा', nameEnglish: 'Banana / Kela', emoji: '🍌', defaultUnit: 'घार' },
  { nameNepali: 'नरिवल', nameEnglish: 'Coconut / Nariyal', emoji: '🥥', defaultUnit: 'गोटा' },
  { nameNepali: 'पानी नरिवल', nameEnglish: 'Pani Nariyal / Water Coconut', emoji: '🥥', defaultUnit: 'गोटा' },
  { nameNepali: 'सुन्तला', nameEnglish: 'Orange / Suntala', emoji: '🍊', defaultUnit: 'क्यारेट' },
  { nameNepali: 'आँप', nameEnglish: 'Mango / Aam', emoji: '🥭', defaultUnit: 'क्यारेट' },
  { nameNepali: 'कालो अंगुर', nameEnglish: 'Black Grapes / Kalo Angoor', emoji: '🍇', defaultUnit: 'कार्टुन' },
  { nameNepali: 'हरियो अंगुर', nameEnglish: 'Green Grapes / Hariyo Angoor', emoji: '🍈', defaultUnit: 'कार्टुन' },
  { nameNepali: 'अनार', nameEnglish: 'Pomegranate / Anaar', emoji: '🫐', defaultUnit: 'कार्टुन' },
  { nameNepali: 'भुइँकटहर', nameEnglish: 'Pineapple', emoji: '🍍', defaultUnit: 'गोटा' },
  { nameNepali: 'खरबुजा', nameEnglish: 'Watermelon', emoji: '🍉', defaultUnit: 'गोटा' },
  { nameNepali: 'लिची', nameEnglish: 'Litchi', emoji: '🍒', defaultUnit: 'कार्टुन' },
  { nameNepali: 'स्ट्रबेरी', nameEnglish: 'Strawberry', emoji: '🍓', defaultUnit: 'कार्टुन' },
  { nameNepali: 'नासपाती', nameEnglish: 'Pear / Naspati', emoji: '🍐', defaultUnit: 'क्यारेट' },
  { nameNepali: 'कागती', nameEnglish: 'Lemon / Kagati', emoji: '🍋', defaultUnit: 'बोरा' },
  { nameNepali: 'मौसम', nameEnglish: 'Sweet Lime / Mausam', emoji: '🍈', defaultUnit: 'क्यारेट' },
  { nameNepali: 'एभोकाडो', nameEnglish: 'Avocado', emoji: '🥑', defaultUnit: 'क्यारेट' },
];

export const AVAILABLE_UNITS: { value: UnitType; label: string }[] = [
  { value: 'गोटा', label: 'संख्या / गोटा (No. / Piece)' },
  { value: 'क्यारेट', label: 'क्यारेट (Carat / Crate)' },
  { value: 'कार्टुन', label: 'बक्स / कार्टुन (Box / Carton)' },
  { value: 'अन्य', label: 'अन्य (Any)' },
  { value: 'बोरा', label: 'बोरा (Bag / Sack)' },
  { value: 'पेटी', label: 'पेटी (Peti)' },
  { value: 'केजी', label: 'केजी (Kg)' },
  { value: 'घार', label: 'घार (Ghar - Banana)' },
  { value: 'दर्जन', label: 'दर्जन (Dozen)' },
];
