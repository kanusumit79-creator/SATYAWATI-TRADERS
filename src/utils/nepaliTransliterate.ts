import React, { useState, useEffect } from 'react';

/**
 * High-Accuracy Nepali Romanized to Devanagari Transliteration & Mandi Translation Engine
 * Converts Roman English words and fruit/mandi terminology into accurate Nepali Devanagari.
 * Supports auto-conversion on space, punctuation, enter, tab, blur, and form submission.
 */

// LocalStorage key for transliteration preference
const TYPING_PREF_KEY = 'satyawati_nepali_typing_clean';

export function getIsNepaliTypingEnabled(): boolean {
  try {
    const val = localStorage.getItem(TYPING_PREF_KEY);
    return val !== null ? val === 'true' : true;
  } catch {
    return true;
  }
}

export function setIsNepaliTypingEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(TYPING_PREF_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent('nepali-translit-toggle', { detail: enabled }));
  } catch (e) {
    console.error(e);
  }
}

/**
 * React hook to synchronize Nepali typing mode across any component.
 */
export function useNepaliTypingToggle(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(getIsNepaliTypingEnabled);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      if (typeof custom.detail === 'boolean') {
        setEnabled(custom.detail);
      } else {
        setEnabled(getIsNepaliTypingEnabled());
      }
    };
    window.addEventListener('nepali-translit-toggle', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('nepali-translit-toggle', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const toggle = (val: boolean) => {
    setIsNepaliTypingEnabled(val);
    setEnabled(val);
  };

  return [enabled, toggle];
}

// 1. Specialized Dictionary for 100% Accuracy on Mandi & Wholesale Terminology,
// Fruits, Common Nepali Names, Castes, and Cities.
const EXACT_DICTIONARY: Record<string, string> = {
  // Common Names & Surnames (First names, Surnames, Mandi Operators)
  sumit: 'सुमित',
  kanu: 'कानु',
  kanoo: 'कानु',
  kannu: 'कानु',
  amit: 'अमित',
  rohit: 'रोहित',
  rahul: 'राहुल',
  ram: 'राम',
  shyam: 'श्याम',
  syam: 'श्याम',
  hari: 'हरि',
  sita: 'सीता',
  seeta: 'सीता',
  gita: 'गीता',
  geeta: 'गीता',
  rita: 'रीता',
  puja: 'पूजा',
  pooja: 'पूजा',
  maya: 'माया',
  laxmi: 'लक्ष्मी',
  lakshmi: 'लक्ष्मी',
  krishna: 'कृष्ण',
  kishan: 'किशन',
  radha: 'राधा',
  radhe: 'राधे',
  gopal: 'गोपाल',
  govind: 'गोविन्द',
  govinda: 'गोविन्द',
  narayan: 'नारायण',
  madhav: 'माधव',
  keshav: 'केशव',
  shiva: 'शिव',
  ganesh: 'गणेश',
  vishnu: 'विष्णु',
  bishnu: 'विष्णु',
  mahesh: 'महेश',
  santosh: 'सन्तोष',
  prakash: 'प्रकाश',
  deepak: 'दीपक',
  dipak: 'दीपक',
  sandip: 'सन्दीप',
  sandeep: 'सन्दीप',
  pradeep: 'प्रदीप',
  pradip: 'प्रदीप',
  kiran: 'किरण',
  bikash: 'विकास',
  vikash: 'विकास',
  bipin: 'बिपिन',
  binod: 'विनोद',
  vinod: 'विनोद',
  ashok: 'अशोक',
  arun: 'अरुण',
  varun: 'वरुण',
  barun: 'बरुण',
  suraj: 'सुरज',
  sooraj: 'सुरज',
  sunil: 'सुनिल',
  anil: 'अनिल',
  manoj: 'मनोज',
  sanjay: 'सञ्जय',
  ajay: 'अजय',
  vijay: 'विजय',
  bijay: 'विजय',
  brijesh: 'बृजेश',
  brajesh: 'बृजेश',
  mukesh: 'मुकेश',
  rakesh: 'राकेश',
  suresh: 'सुरेश',
  ramesh: 'रमेश',
  dinesh: 'दिनेश',
  naresh: 'नरेश',
  dipendra: 'दिपेन्द्र',
  surendra: 'सुरेन्द्र',
  narendra: 'नरेन्द्र',
  birendra: 'बिरेन्द्र',
  rajendra: 'राजेन्द्र',
  mahendra: 'महेन्द्र',
  shankar: 'शंकर',
  anand: 'आनन्द',
  rabin: 'रविन',
  subash: 'सुवास',
  subhash: 'सुभाष',
  kailash: 'कैलाश',
  umesh: 'उमेश',
  babu: 'बाबु',
  raja: 'राजा',
  bhai: 'भाइ',
  dai: 'दाइ',
  didi: 'दिदी',
  bahini: 'बहिनी',
  kaka: 'काका',
  mama: 'मामा',
  sahuji: 'साहुजी',
  sahu: 'साहु',
  malik: 'मालिक',

  // Surnames / Castes
  gupta: 'गुप्ता',
  yadav: 'यादव',
  thapa: 'थापा',
  shrestha: 'श्रेष्ठ',
  shresth: 'श्रेष्ठ',
  chaudhary: 'चौधरी',
  chaudhari: 'चौधरी',
  sah: 'साह',
  saha: 'साह',
  shah: 'शाह',
  sahi: 'शाही',
  baniya: 'बनिया',
  bania: 'बनिया',
  halwai: 'हलुवाई',
  kasaudhan: 'कसौधन',
  jaiswal: 'जैसवाल',
  jaswal: 'जैसवाल',
  agrawal: 'अग्रवाल',
  agarwal: 'अग्रवाल',
  sharma: 'शर्मा',
  sarma: 'शर्मा',
  verma: 'वर्मा',
  barma: 'वर्मा',
  mishra: 'मिश्र',
  misra: 'मिश्र',
  pandey: 'पाण्डे',
  pande: 'पाण्डे',
  pandit: 'पण्डित',
  tiwari: 'तिवारी',
  tewari: 'तिवारी',
  tripathi: 'त्रिपाठी',
  mahato: 'महतो',
  mahto: 'महतो',
  mandal: 'मण्डल',
  das: 'दास',
  patel: 'पटेल',
  adhikari: 'अधिकारी',
  bhandari: 'भण्डारी',
  subedi: 'सुवेदी',
  karki: 'कार्की',
  bhattarai: 'भट्टराई',
  gyawali: 'ज्ञावली',
  ghimire: 'घिमिरे',
  pokharel: 'पोखरेल',
  pokhrel: 'पोखरेल',
  dahal: 'दाहाल',
  oli: 'ओली',
  bista: 'बिष्ट',
  khatri: 'खत्री',
  khadka: 'खड्का',
  bohara: 'बोहरा',
  bohura: 'बोहरा',
  gurung: 'गुरुङ',
  magar: 'मगर',
  rai: 'राई',
  tamang: 'तामाङ',
  limbu: 'लिम्बु',
  sherpa: 'शेर्पा',
  joshi: 'जोशी',
  basnet: 'बस्नेत',
  basnyat: 'बस्न्यात',
  poudel: 'पौडेल',
  paudel: 'पौडेल',
  regmi: 'रेग्मी',
  dhakal: 'ढकाल',
  acharya: 'आचार्य',
  kc: 'के.सी.',
  singh: 'सिंह',
  prasad: 'प्रसाद',
  bahadur: 'बहादुर',
  lal: 'लाल',
  raj: 'राज',
  khan: 'खान',
  chhetri: 'क्षेत्री',
  brahmin: 'बाहुन',
  bahun: 'बाहुन',
  newar: 'नेवार',
  tharu: 'थारु',
  sunar: 'सुनार',
  raut: 'राउत',
  soni: 'सोनी',
  swarnakar: 'स्वर्णकार',
  giri: 'गिरी',
  puri: 'पुरी',
  dhobi: 'धोबी',
  kohar: 'कोहार',
  kurmi: 'कुर्मी',
  kushwaha: 'कुशवाहा',
  sahani: 'सहनी',
  paswan: 'पासवान',
  chamar: 'चमार',
  chaurasia: 'चौरसिया',
  badhai: 'बढई',
  lohar: 'लोहार',
  khatik: 'खटिक',
  ojha: 'ओझा',

  // Fruits (फलफूलहरू) - Both English and Roman transliterations
  syau: 'स्याउ',
  seb: 'स्याउ',
  apple: 'स्याउ',
  fuji: 'फुजी स्याउ',
  shimlasyau: 'शिमला स्याउ',
  kashmiri: 'काश्मीरी स्याउ',
  royal: 'रोयल स्याउ',
  golden: 'गोल्डेन स्याउ',
  gala: 'गाला स्याउ',
  kera: 'केरा',
  kela: 'केरा',
  banana: 'केरा',
  chini: 'चिनी चम्पा केरा',
  champa: 'चम्पा केरा',
  chinichampa: 'चिनी चम्पा केरा',
  malbhog: 'मालभोग केरा',
  harichhal: 'हरिछाल केरा',
  robusta: 'रोबस्टा केरा',
  aam: 'आँप',
  aap: 'आँप',
  anp: 'आँप',
  mango: 'आँप',
  dusseheri: 'दशहरी आँप',
  dussehari: 'दशहरी आँप',
  langra: 'लङ्गडा आँप',
  amrapali: 'आम्रपाली आँप',
  malda: 'मालदा आँप',
  alphonso: 'अल्फान्सो आँप',
  banganapalli: 'बङ्गनपल्ली आँप',
  chausa: 'चौसा आँप',
  safeda: 'सफेदा आँप',
  totapuri: 'तोतापुरी आँप',
  kesar: 'केसर आँप',
  anar: 'अनार',
  dalim: 'अनार',
  daalim: 'अनार',
  pomegranate: 'अनार',
  kabulianar: 'काबुली अनार',
  kabuli: 'काबुली अनार',
  kandhari: 'कन्धारी अनार',
  bhagwa: 'भगवा अनार',
  kivi: 'किवी',
  kiwi: 'किवी',
  hayward: 'हेवर्ड किवी',
  nariwal: 'नरिवल',
  narewal: 'नरिवल',
  nariyal: 'नरिवल',
  coconut: 'नरिवल',
  dab: 'डाब',
  daab: 'डाब',
  greencoconut: 'हरियो डाब',
  angur: 'अंगुर',
  angoor: 'अंगुर',
  grapes: 'अंगुर',
  blackgrapes: 'कालो अंगुर',
  greengrapes: 'हरियो अंगुर',
  redglobe: 'रेड ग्लोब अंगुर',
  sonaka: 'सोनाका अंगुर',
  thompson: 'थम्प्सन अंगुर',
  sharad: 'शरद अंगुर',
  suntala: 'सुन्तला',
  santala: 'सुन्तला',
  orange: 'सुन्तला',
  kinnow: 'किन्नो सुन्तला',
  nagpursuntala: 'नागपुर सुन्तला',
  darjeeling: 'दार्जिलिङ सुन्तला',
  dhankuta: 'धनकुटा सुन्तला',
  mausami: 'मौसमी',
  mosami: 'मौसमी',
  mosambi: 'मौसमी',
  sweetlime: 'मौसमी',
  lime: 'कागती',
  amrud: 'अम्बा',
  amba: 'अम्बा',
  aamba: 'अम्बा',
  guava: 'अम्बा',
  tarbuj: 'तरबुज',
  tarbuja: 'तरबुज',
  tarbooj: 'तरबुज',
  watermelon: 'तरबुज',
  kharbuj: 'खर्बुजा',
  kharbuja: 'खर्बुजा',
  muskmelon: 'खर्बुजा',
  cantaloupe: 'खर्बुजा',
  mewa: 'मेवा',
  papita: 'मेवा',
  papaya: 'मेवा',
  redlady: 'रेड लेडी मेवा',
  katahar: 'कटहर',
  kathar: 'कटहर',
  jackfruit: 'कटहर',
  bhuikatahar: 'भुइँकटहर',
  bhui: 'भुइँ',
  ananas: 'भुइँकटहर',
  pineapple: 'भुइँकटहर',
  litchi: 'लिची',
  lechi: 'लिची',
  leechi: 'लिची',
  lychee: 'लिची',
  shahi: 'शाही लिची',
  nashpati: 'नासपाती',
  naspati: 'नासपाती',
  pear: 'नासपाती',
  kagati: 'कागती',
  kagti: 'कागती',
  lemon: 'कागती',
  nimbu: 'कागती',
  dragon: 'ड्र्यागन फ्रुट',
  dragonfruit: 'ड्र्यागन फ्रुट',
  pitaya: 'ड्र्यागन फ्रुट',
  avocado: 'एभोकाडो',
  abocado: 'एभोकाडो',
  cheri: 'चेरी',
  cherry: 'चेरी',
  strawberry: 'स्ट्रबेरी',
  stroberi: 'स्ट्रबेरी',
  aaru: 'आरु',
  peach: 'आरु',
  plum: 'आरुबखडा',
  alubukhara: 'आरुबखडा',
  aarubakhada: 'आरुबखडा',
  khubani: 'खुबानी',
  apricot: 'खुबानी',
  anjeer: 'अन्जिर',
  fig: 'अन्जिर',
  chhohara: 'छोहोरा',
  khajur: 'खजुर',
  dates: 'छोहोरा',
  badam: 'बदाम',
  almond: 'बदाम',
  kaju: 'काजु',
  cashew: 'काजु',
  kismis: 'किसमिस',
  kishmish: 'किसमिस',
  raisins: 'किसमिस',
  raisin: 'किसमिस',
  okhar: 'ओखर',
  walnut: 'ओखर',
  amala: 'अमला',
  amla: 'अमला',
  jamun: 'जामुन',
  blackplum: 'जामुन',
  sharifa: 'शरीफा',
  sitafal: 'सीताफल',
  custardapple: 'शरीफा',
  bel: 'बेल',
  chiku: 'चिकु',
  sapota: 'चिकु',
  aalu: 'आलु',
  alu: 'आलु',
  potato: 'आलु',
  pyaj: 'प्याज',
  pyaaj: 'प्याज',
  onion: 'प्याज',
  tamatar: 'गोलभेँडा',
  golbheda: 'गोलभेँडा',
  golbhenda: 'गोलभेँडा',
  tomato: 'गोलभेँडा',
  adhuwa: 'अदुवा',
  aaduwa: 'अदुवा',
  ginger: 'अदुवा',
  lasun: 'लसुन',
  lahsun: 'लसुन',
  garlic: 'लसुन',
  dhaniya: 'धनियाँ',
  coriander: 'धनियाँ',
  khursani: 'खुर्सानी',
  chilli: 'खुर्सानी',
  mirchi: 'खुर्सानी',

  // Mandi, Billing & Business Words
  mandi: 'मण्डी',
  bajar: 'बजार',
  bazaar: 'बजार',
  bazar: 'बजार',
  market: 'बजार',
  thok: 'थोक',
  wholesale: 'थोक',
  khudra: 'खुद्रा',
  khudre: 'खुद्रा',
  retail: 'खुद्रा',
  khata: 'खाता',
  ledger: 'खाता',
  account: 'खाता',
  bill: 'बिल',
  bijak: 'बीजक',
  invoice: 'बिल',
  nagad: 'नगद',
  cash: 'नगद',
  udharo: 'उधारो',
  credit: 'उधारो',
  baki: 'बाँकी',
  baaki: 'बाँकी',
  due: 'बाँकी',
  balance: 'बाँकी',
  jama: 'जम्मा',
  jamma: 'जम्मा',
  total: 'जम्मा',
  subtotal: 'उप-कुल',
  chhut: 'छुट',
  chhoot: 'छुट',
  discount: 'छुट',
  dar: 'दर',
  rate: 'दर',
  mulya: 'मूल्य',
  price: 'दर',
  pariman: 'परिमाण',
  quantity: 'परिमाण',
  qty: 'परिमाण',
  gadi: 'गाडी',
  gaadi: 'गाडी',
  truck: 'गाडी',
  vehicle: 'गाडी',
  chalak: 'चालक',
  driver: 'चालक',
  bhada: 'भाडा',
  bhaada: 'भाडा',
  fare: 'भाडा',
  freight: 'भाडा',
  traders: 'ट्रेडर्स',
  falful: 'फलफूल',
  falphul: 'फलफूल',
  phalful: 'फलफूल',
  pasal: 'पसल',
  shop: 'पसल',
  store: 'स्टोर',
  stores: 'स्टोर',
  center: 'सेन्टर',
  centre: 'सेन्टर',
  supplier: 'सप्लायर',
  customer: 'ग्राहक',
  grahak: 'ग्राहक',
  party: 'पार्टी',
  parties: 'पार्टीहरू',
  paisa: 'पैसा',
  rupiya: 'रुपैयाँ',
  rupee: 'रु.',
  rs: 'रु.',
  kilo: 'किलो',
  kg: 'केजी',
  peti: 'पेटी',
  crate: 'क्रेट',
  kret: 'क्रेट',
  bora: 'बोरा',
  sack: 'बोरा',
  carton: 'कार्टुन',
  kartun: 'कार्टुन',
  dozen: 'दर्जन',
  darjan: 'दर्जन',
  gota: 'गोटा',
  ghaar: 'घार',
  bhatta: 'भत्ता',
  kharcha: 'खर्च',
  expense: 'खर्च',
  expenses: 'खर्चहरू',
  aamdani: 'आम्दानी',
  income: 'आम्दानी',
  hisab: 'हिसाब',
  hisaab: 'हिसाब',
  godam: 'गोदाम',
  warehouse: 'गोदाम',
  byapari: 'व्यापारी',
  merchant: 'व्यापारी',

  // Key Proprietor & Business Names
  satyawati: 'सत्यवती',
  kumar: 'कुमार',
  maa: 'माँ',
  durga: 'दुर्गा',
  devi: 'देवी',
  prassanna: 'प्रसन्न',
  prashanna: 'प्रसन्न',

  // Places (Nepal & Mandi Hubs)
  nepal: 'नेपाल',
  nepali: 'नेपाली',
  butwal: 'बुटवल',
  bhairahawa: 'भैरहवा',
  kathmandu: 'काठमाडौँ',
  ktm: 'काठमाडौँ',
  pokhara: 'पोखरा',
  chitwan: 'चितवन',
  narayangarh: 'नारायणगढ',
  parasi: 'परासी',
  krishnanagar: 'कृष्णनगर',
  taulihawa: 'तौलिहवा',
  kapilvastu: 'कपिलवस्तु',
  dang: 'दाङ',
  ghorahi: 'घोराही',
  tulsipur: 'तुलसीपुर',
  palpa: 'पाल्पा',
  tansen: 'तानसेन',
  gulmi: 'गुल्मी',
  tamghas: 'तम्घास',
  arghakhanchi: 'अर्घाखाँची',
  sandhikharka: 'सन्धिखर्क',
  lalitpur: 'ललितपुर',
  bhaktapur: 'भक्तपुर',
  birgunj: 'वीरगन्ज',
  biratnagar: 'विराटनगर',
  dharan: 'धरान',
  itahari: 'इटहरी',
  hetauda: 'हेटौंडा',
  janakpur: 'जनकपुर',
  nepalgunj: 'नेपालगन्ज',
  surkhet: 'सुर्खेत',
  mustang: 'मुस्ताङ',
  manang: 'मनाङ',
  jumla: 'जुम्ला',
  delhi: 'दिल्ली',
  shimla: 'शिमला',
  kashmir: 'काश्मीर',
  nagpur: 'नागपुर',
  nashik: 'नाशिक',
  gorakhpur: 'गोरखपुर',
  lucknow: 'लखनऊ',
  patna: 'पटना',
  varanasi: 'वाराणसी',
  banaras: 'बनारस',
  milanchowk: 'मिलनचोक',
  trafficchowk: 'ट्राफिक चोक',
  amarpath: 'अमरपथ',
  buspark: 'बसपार्क',

  // Conversational & Common Words
  namaste: 'नमस्ते',
  namaskar: 'नमस्कार',
  dhanyabad: 'धन्यवाद',
  dhanyabaad: 'धन्यवाद',
  hajur: 'हजुर',
  subha: 'शुभ',
  aaja: 'आज',
  bholi: 'भोलि',
  hijo: 'हिजो',
  parsi: 'पर्सि',
  asti: 'अस्ति',
  chhito: 'छिटो',
  dhilo: 'ढिलो',
  ramro: 'राम्रो',
  naramro: 'नराम्रो',
  dherai: 'धेरै',
  thorai: 'थोरै',
  sano: 'सानो',
  thulo: 'ठूलो',
  nawa: 'नयाँ',
  naya: 'नयाँ',
  purano: 'पुरानो',
  cha: 'छ',
  chaina: 'छैन',
  bhayo: 'भयो',
  bhayeko: 'भएको',
  nabhayeko: 'नभएको',
  mero: 'मेरो',
  hamro: 'हाम्रो',
  usko: 'उसको',
  tapai: 'तपाईं',
  tapaiko: 'तपाईंको',
  timi: 'तिमी',
  yo: 'यो',
  tyo: 'त्यो',
  yaha: 'यहाँ',
  tyaha: 'त्यहाँ',
  kati: 'कति',
  kasto: 'कस्तो',
  kasari: 'कसरी',
  kina: 'किन',
  kahile: 'कहिले',
  thik: 'ठीक',
  le: 'ले',
  lai: 'लाई',
  ko: 'को',
  ka: 'का',
  ki: 'की',
  ma: 'मा',
  bata: 'बाट',
  dekhi: 'देखि',
  sanga: 'सँग',
  dinus: 'दिनुहोस्',
  linus: 'लिनुहोस्',
  rakhnus: 'राख्नुहोस्',
  garnus: 'गर्नुहोस्',
  aunu: 'आउनुहोस्',
  janu: 'जानुहोस्',
};

// 2. Phonetic Rules for General Nepali Words
const VOWELS: Record<string, string> = {
  aa: 'आ',
  a: 'अ',
  ee: 'ई',
  ii: 'ई',
  i: 'इ',
  oo: 'ऊ',
  uu: 'ऊ',
  u: 'उ',
  ai: 'ऐ',
  au: 'औ',
  ou: 'औ',
  e: 'ए',
  o: 'ओ',
  ri: 'ऋ',
};

const MATRAS: Record<string, string> = {
  aa: 'ा',
  a: '', // Inherent vowel (handled contextually)
  ee: 'ी',
  ii: 'ी',
  i: 'ि',
  oo: 'ू',
  uu: 'ू',
  u: 'ु',
  ai: 'ै',
  au: 'ौ',
  ou: 'ौ',
  e: 'े',
  o: 'ो',
  ri: 'ृ',
};

// Consonant ordering: Longer prefix matched first
const CONSONANTS: [string, string][] = [
  ['ksha', 'क्ष्'],
  ['ksh', 'क्ष्'],
  ['gya', 'ज्ञ्'],
  ['gy', 'ज्ञ्'],
  ['tra', 'त्र्'],
  ['tr', 'त्र्'],
  ['shr', 'श्र्'],
  ['chh', 'छ्'],
  ['kh', 'ख्'],
  ['gh', 'घ्'],
  ['ng', 'ङ्'],
  ['ch', 'च्'],
  ['jh', 'झ्'],
  ['th', 'थ्'],
  ['Th', 'ठ्'],
  ['dh', 'ध्'],
  ['Dh', 'ढ्'],
  ['ph', 'फ्'],
  ['bh', 'भ्'],
  ['shh', 'ष्'],
  ['sh', 'श्'],
  ['pr', 'प्र्'],
  ['kr', 'क्र्'],
  ['gr', 'ग्र्'],
  ['dr', 'द्र्'],
  ['br', 'ब्र्'],
  ['mr', 'म्र्'],
  ['vr', 'व्र्'],
  ['wr', 'व्र्'],
  ['st', 'स्त्'],
  ['sp', 'स्प्'],
  ['sk', 'स्क्'],
  ['sm', 'स्म्'],
  ['sn', 'स्न्'],
  ['sw', 'स्व्'],
  ['sy', 'स्य्'],
  ['ty', 'त्य्'],
  ['dy', 'द्य्'],
  ['ny', 'न्य्'],
  ['py', 'प्य्'],
  ['by', 'ब्य्'],
  ['vy', 'व्य्'],
  ['k', 'क्'],
  ['g', 'ग्'],
  ['c', 'च्'],
  ['j', 'ज्'],
  ['T', 'ट्'],
  ['D', 'ड्'],
  ['N', 'ण्'],
  ['t', 'त्'],
  ['d', 'द्'],
  ['n', 'न्'],
  ['p', 'प्'],
  ['f', 'फ्'],
  ['b', 'ब्'],
  ['m', 'म्'],
  ['y', 'य्'],
  ['r', 'र्'],
  ['l', 'ल्'],
  ['w', 'व्'],
  ['v', 'व्'],
  ['s', 'स्'],
  ['h', 'ह्'],
  ['z', 'ज्'],
  ['x', 'क्ष्'],
];

/**
 * Transliterates a single Romanized English word into Nepali Devanagari.
 */
export function transliterateWord(word: string): string {
  if (!word) return '';

  const lower = word.toLowerCase();

  // 1. Direct dictionary match
  if (EXACT_DICTIONARY[lower]) {
    return EXACT_DICTIONARY[lower];
  }

  // 2. Phonetic algorithmic conversion
  let result = '';
  let i = 0;
  const n = word.length;

  while (i < n) {
    let matched = false;

    // Check consonant match
    for (const [latin, dev] of CONSONANTS) {
      if (word.substr(i, latin.length).toLowerCase() === latin.toLowerCase()) {
        i += latin.length;
        matched = true;

        // Check if immediately followed by a vowel
        let vowelKey: string | null = null;
        let vowelLen = 0;

        for (const v of [
          'aa',
          'ee',
          'ii',
          'oo',
          'uu',
          'ai',
          'au',
          'ou',
          'ri',
          'a',
          'i',
          'u',
          'e',
          'o',
        ]) {
          if (word.substr(i, v.length).toLowerCase() === v) {
            vowelKey = v;
            vowelLen = v.length;
            break;
          }
        }

        if (vowelKey !== null) {
          const isAtEnd = i + vowelLen >= n;

          if (vowelKey === 'a') {
            // CRITICAL ROMAN NEPALI RULE:
            // Terminal 'a' in Nepali Roman writing almost ALWAYS means 'ा' (aa matra).
            // E.g. thapa -> थापा, khata -> खाता, bhada -> भाडा, gupta -> गुप्ता,
            // kera -> केरा, mewa -> मेवा, sita -> सीता, gita -> गीता, paisa -> पैसा
            if (isAtEnd) {
              result += dev.replace(/्$/, '') + 'ा';
            } else {
              // Internal 'a' drops halant, keeping implicit inherent 'a' (e.g. kalam -> कलम, namaste -> नमस्ते)
              result += dev.replace(/्$/, '');
            }
          } else {
            // Other vowels (aa, i, ee, u, oo, e, o, ai, au, ri)
            const matra = MATRAS[vowelKey] || '';
            result += dev.replace(/्$/, '') + matra;
          }
          i += vowelLen;
        } else {
          // No vowel directly follows
          // If at the end of the word, in Nepali it drops the halant (e.g. ram -> राम, sumit -> सुमित)
          if (i >= n) {
            result += dev.replace(/्$/, '');
          } else {
            // Check if this is 'n' or 'm' before another consonant -> anusvara 'ं'
            const nextChar = word[i]?.toLowerCase();
            const isNasal = latin === 'n' || latin === 'm';
            const nextIsConsonant = CONSONANTS.some(([c]) =>
              word.substr(i, c.length).toLowerCase() === c.toLowerCase()
            );

            if (isNasal && nextIsConsonant) {
              result += 'ं';
            } else {
              // Keep halant for consonant clusters (e.g. sy in syau -> स् + य)
              result += dev;
            }
          }
        }
        break;
      }
    }

    if (!matched) {
      // Check independent vowel at beginning of syllable
      let matchedVowel = false;
      for (const v of [
        'aa',
        'ee',
        'ii',
        'oo',
        'uu',
        'ai',
        'au',
        'ou',
        'ri',
        'a',
        'i',
        'u',
        'e',
        'o',
      ]) {
        if (word.substr(i, v.length).toLowerCase() === v) {
          result += VOWELS[v] || v;
          i += v.length;
          matchedVowel = true;
          break;
        }
      }

      if (!matchedVowel) {
        // Keep non-alphabetic character (punctuation, digit, Nepali Unicode character, etc.)
        result += word[i];
        i++;
      }
    }
  }

  return result;
}

/**
 * Transliterates an entire sentence or multi-word text into Devanagari.
 */
export function transliterateSentence(text: string): string {
  if (!text) return '';
  // Convert all Roman words [a-zA-Z]+ to Devanagari while preserving spaces and punctuation
  return text.replace(/[a-zA-Z]+/g, (word) => transliterateWord(word));
}

/**
 * Triggered on SPACE or PUNCTUATION: checks if the word immediately preceding the cursor is a Roman word.
 * If so, converts it into Devanagari while preserving cursor position and surrounding text.
 */
export function convertTextOnSpace(
  value: string,
  cursorPos?: number
): { newText: string; newCursor: number; didConvert: boolean } {
  const pos = cursorPos !== undefined ? cursorPos : value.length;
  const beforeCursor = value.slice(0, pos);
  const afterCursor = value.slice(pos);

  // Match a Latin word followed by spaces or punctuation delimiter at the end of beforeCursor
  // e.g. "syau " or "ram, " or "sumit kanu "
  const match = beforeCursor.match(/([a-zA-Z]+)([\s,.;:\-_/()!?]+)$/);
  if (match) {
    const romanWord = match[1];
    const delimiters = match[2];
    const devanagariWord = transliterateWord(romanWord);
    const prefix = beforeCursor.slice(0, beforeCursor.length - match[0].length);
    const replaced = prefix + devanagariWord + delimiters;

    return {
      newText: replaced + afterCursor,
      newCursor: replaced.length,
      didConvert: true,
    };
  }

  return { newText: value, newCursor: pos, didConvert: false };
}

/**
 * Universal input handler to attach to input/textarea onChange.
 * When Nepali mode is ON: automatically converts preceding Roman word to Devanagari when SPACE or punctuation is pressed!
 * When Nepali mode is OFF: leaves user input unchanged as standard English.
 */
export function handleDevanagariChange(
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  setValue: (val: string) => void
) {
  const input = e.target;
  const val = input.value;

  // If user disabled Roman->Nepali transliteration, accept raw input
  if (!getIsNepaliTypingEnabled()) {
    setValue(val);
    return;
  }

  const cursor = input.selectionStart ?? val.length;
  const { newText, newCursor, didConvert } = convertTextOnSpace(val, cursor);

  if (didConvert) {
    setValue(newText);
    requestAnimationFrame(() => {
      try {
        input.setSelectionRange(newCursor, newCursor);
      } catch (_) {}
    });
  } else {
    setValue(val);
  }
}

/**
 * Universal keydown handler for Enter and Tab:
 * If Enter/Tab is pressed and Nepali mode is ON, converts any unconverted Roman words.
 */
export function handleDevanagariKeyDown(
  e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  value: string,
  setValue: (val: string) => void
) {
  if (!getIsNepaliTypingEnabled()) return;

  if (e.key === 'Enter' || e.key === 'Tab') {
    const converted = transliterateSentence(value);
    if (converted !== value) {
      setValue(converted);
    }
  }
}

/**
 * Universal blur handler: when leaving the field, converts any remaining English words to Devanagari
 * if Nepali typing is enabled.
 */
export function handleDevanagariBlur(
  value: string,
  setValue: (val: string) => void
) {
  if (!getIsNepaliTypingEnabled()) return;

  const converted = transliterateSentence(value);
  if (converted !== value) {
    setValue(converted);
  }
}

/**
 * Explicit 1-tap conversion helper: converts any text into Devanagari on demand.
 */
export function forceTransliterate(
  text: string,
  setValue?: (val: string) => void
): string {
  if (!text) return '';
  const converted = transliterateSentence(text);
  if (setValue) {
    setValue(converted);
  }
  return converted;
}

/**
 * Bi-directional fruit name translator:
 * Given any input (e.g. "apple", "fuji", "स्याउ", "केरा", "banana"), returns both English and Nepali names.
 */
export function autoTranslateFruit(input: string): { nepaliName: string; englishName: string } {
  if (!input || !input.trim()) {
    return { nepaliName: '', englishName: '' };
  }

  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  // English -> Nepali mapping
  const enToNp: Record<string, { np: string; en: string }> = {
    apple: { np: 'स्याउ', en: 'Apple' },
    'fuji apple': { np: 'फुजी स्याउ', en: 'Fuji Apple' },
    fuji: { np: 'फुजी स्याउ', en: 'Fuji Apple' },
    'shimla apple': { np: 'शिमला स्याउ', en: 'Shimla Apple' },
    shimla: { np: 'शिमला स्याउ', en: 'Shimla Apple' },
    'kashmiri apple': { np: 'काश्मीरी स्याउ', en: 'Kashmiri Apple' },
    banana: { np: 'केरा', en: 'Banana' },
    'malbhog banana': { np: 'मालभोग केरा', en: 'Malbhog Banana' },
    malbhog: { np: 'मालभोग केरा', en: 'Malbhog Banana' },
    'chini champa': { np: 'चिनी चम्पा केरा', en: 'Chini Champa Banana' },
    mango: { np: 'आँप', en: 'Mango' },
    'dusseheri mango': { np: 'दशहरी आँप', en: 'Dusseheri Mango' },
    dusseheri: { np: 'दशहरी आँप', en: 'Dusseheri Mango' },
    'langra mango': { np: 'लङ्गडा आँप', en: 'Langra Mango' },
    langra: { np: 'लङ्गडा आँप', en: 'Langra Mango' },
    'amrapali mango': { np: 'आम्रपाली आँप', en: 'Amrapali Mango' },
    amrapali: { np: 'आम्रपाली आँप', en: 'Amrapali Mango' },
    'malda mango': { np: 'मालदा आँप', en: 'Malda Mango' },
    malda: { np: 'मालदा आँप', en: 'Malda Mango' },
    orange: { np: 'सुन्तला', en: 'Orange' },
    'nagpur orange': { np: 'नागपुर सुन्तला', en: 'Nagpur Orange' },
    kinnow: { np: 'किन्नो सुन्तला', en: 'Kinnow Orange' },
    pomegranate: { np: 'अनार', en: 'Pomegranate' },
    'kabuli pomegranate': { np: 'काबुली अनार', en: 'Kabuli Pomegranate' },
    grapes: { np: 'अंगुर', en: 'Grapes' },
    'black grapes': { np: 'कालो अंगुर', en: 'Black Grapes' },
    'green grapes': { np: 'हरियो अंगुर', en: 'Green Grapes' },
    'kalo angur': { np: 'कालो अंगुर', en: 'Black Grapes' },
    'kalo angoor': { np: 'कालो अंगुर', en: 'Black Grapes' },
    'hariyo angur': { np: 'हरियो अंगुर', en: 'Green Grapes' },
    'hariyo angoor': { np: 'हरियो अंगुर', en: 'Green Grapes' },
    watermelon: { np: 'तरबुज', en: 'Watermelon' },
    muskmelon: { np: 'खर्बुजा', en: 'Muskmelon' },
    papaya: { np: 'मेवा', en: 'Papaya' },
    guava: { np: 'अम्बा', en: 'Guava' },
    'guava small': { np: 'अम्बा (सानो)', en: 'Guava (Small)' },
    'guava big': { np: 'अम्बा (ठूलो)', en: 'Guava (Big)' },
    'small guava': { np: 'अम्बा (सानो)', en: 'Guava (Small)' },
    'big guava': { np: 'अम्बा (ठूलो)', en: 'Guava (Big)' },
    pineapple: { np: 'भुइँकटहर', en: 'Pineapple' },
    jackfruit: { np: 'कटहर', en: 'Jackfruit' },
    kiwi: { np: 'किवी', en: 'Kiwi' },
    coconut: { np: 'नरिवल', en: 'Coconut' },
    'pani nariyal': { np: 'पानी नरिवल', en: 'Pani Nariyal' },
    'paninariyal': { np: 'पानी नरिवल', en: 'Pani Nariyal' },
    'water coconut': { np: 'पानी नरिवल', en: 'Water Coconut' },
    'green coconut': { np: 'डाब', en: 'Green Coconut' },
    litchi: { np: 'लिची', en: 'Litchi' },
    pear: { np: 'नासपाती', en: 'Pear' },
    lemon: { np: 'कागती', en: 'Lemon' },
    'dragon fruit': { np: 'ड्र्यागन फ्रुट', en: 'Dragon Fruit' },
    dragonfruit: { np: 'ड्र्यागन फ्रुट', en: 'Dragon Fruit' },
    avocado: { np: 'एभोकाडो', en: 'Avocado' },
    strawberry: { np: 'स्ट्रबेरी', en: 'Strawberry' },
    cherry: { np: 'चेरी', en: 'Cherry' },
    peach: { np: 'आरु', en: 'Peach' },
    plum: { np: 'आरुबखडा', en: 'Plum' },
    potato: { np: 'आलु', en: 'Potato' },
    onion: { np: 'प्याज', en: 'Onion' },
    tomato: { np: 'गोलभेँडा', en: 'Tomato' },
  };

  if (enToNp[lower]) {
    return { nepaliName: enToNp[lower].np, englishName: enToNp[lower].en };
  }

  // Nepali -> English mapping
  const npToEn: Record<string, { np: string; en: string }> = {
    स्याउ: { np: 'स्याउ', en: 'Apple' },
    'फुजी स्याउ': { np: 'फुजी स्याउ', en: 'Fuji Apple' },
    'शिमला स्याउ': { np: 'शिमला स्याउ', en: 'Shimla Apple' },
    'काश्मीरी स्याउ': { np: 'काश्मीरी स्याउ', en: 'Kashmiri Apple' },
    केरा: { np: 'केरा', en: 'Banana' },
    'मालभोग केरा': { np: 'मालभोग केरा', en: 'Malbhog Banana' },
    'चिनी चम्पा केरा': { np: 'चिनी चम्पा केरा', en: 'Chini Champa Banana' },
    'हरिछाल केरा': { np: 'हरिछाल केरा', en: 'Harichhal Banana' },
    आँप: { np: 'आँप', en: 'Mango' },
    'दशहरी आँप': { np: 'दशहरी आँप', en: 'Dusseheri Mango' },
    'लङ्गडा आँप': { np: 'लङ्गडा आँप', en: 'Langra Mango' },
    'आम्रपाली आँप': { np: 'आम्रपाली आँप', en: 'Amrapali Mango' },
    'मालदा आँप': { np: 'मालदा आँप', en: 'Malda Mango' },
    सुन्तला: { np: 'सुन्तला', en: 'Orange' },
    'नागपुर सुन्तला': { np: 'नागपुर सुन्तला', en: 'Nagpur Orange' },
    'किन्नो सुन्तला': { np: 'किन्नो सुन्तला', en: 'Kinnow Orange' },
    अनार: { np: 'अनार', en: 'Pomegranate' },
    'काबुली अनार': { np: 'काबुली अनार', en: 'Kabuli Pomegranate' },
    अंगुर: { np: 'अंगुर', en: 'Grapes' },
    'कालो अंगुर': { np: 'कालो अंगुर', en: 'Black Grapes' },
    'हरियो अंगुर': { np: 'हरियो अंगुर', en: 'Green Grapes' },
    तरबुज: { np: 'तरबुज', en: 'Watermelon' },
    खर्बुजा: { np: 'खर्बुजा', en: 'Muskmelon' },
    मेवा: { np: 'मेवा', en: 'Papaya' },
    अम्बा: { np: 'अम्बा', en: 'Guava' },
    'अम्बा (सानो)': { np: 'अम्बा (सानो)', en: 'Guava (Small)' },
    'अम्बा (ठूलो)': { np: 'अम्बा (ठूलो)', en: 'Guava (Big)' },
    भुइँकटहर: { np: 'भुइँकटहर', en: 'Pineapple' },
    कटहर: { np: 'कटहर', en: 'Jackfruit' },
    किवी: { np: 'किवी', en: 'Kiwi' },
    नरिवल: { np: 'नरिवल', en: 'Coconut' },
    'पानी नरिवल': { np: 'पानी नरिवल', en: 'Pani Nariyal' },
    डाब: { np: 'डाब', en: 'Green Coconut' },
    लिची: { np: 'लिची', en: 'Litchi' },
    नासपाती: { np: 'नासपाती', en: 'Pear' },
    कागती: { np: 'कागती', en: 'Lemon' },
    'ड्र्यागन फ्रुट': { np: 'ड्र्यागन फ्रुट', en: 'Dragon Fruit' },
    एभोकाडो: { np: 'एभोकाडो', en: 'Avocado' },
    स्ट्रबेरी: { np: 'स्ट्रबेरी', en: 'Strawberry' },
    चेरी: { np: 'चेरी', en: 'Cherry' },
    आरु: { np: 'आरु', en: 'Peach' },
    आरुबखडा: { np: 'आरुबखडा', en: 'Plum' },
    आलु: { np: 'आलु', en: 'Potato' },
    प्याज: { np: 'प्याज', en: 'Onion' },
    गोलभेँडा: { np: 'गोलभेँडा', en: 'Tomato' },
  };

  if (npToEn[trimmed]) {
    return { nepaliName: npToEn[trimmed].np, englishName: npToEn[trimmed].en };
  }

  // If text contains Roman letters, transliterate to Nepali
  if (/[a-zA-Z]/.test(trimmed)) {
    const transliterated = transliterateSentence(trimmed);
    return { nepaliName: transliterated, englishName: trimmed };
  }

  return { nepaliName: trimmed, englishName: trimmed };
}
