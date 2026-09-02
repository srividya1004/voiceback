import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Mic,
  Square,
  Volume2,
  CheckCircle2,
  ArrowLeft,
  Settings,
  Radio,
  Globe,
  RefreshCw,
  Check,
  AlertTriangle,
  Sparkles,
  X
} from 'lucide-react';
import SettingsBottomSheet from './SettingsBottomSheet';
import { useSettings } from '../context/SettingsContext';
import voiceService from '../services/voiceService';
import deviceService from '../services/deviceService';
import contextService from '../services/contextService';

/**
 * Lightweight Deterministic Dynamic Question Classifier & Response Generator
 */
export const generateDynamicResponses = (questionText, language = 'English') => {
  const q = (questionText || '').toLowerCase().trim();

  // 1. Water / Hydration / Drink
  if (q.includes('water') || q.includes('drink') || q.includes('thirst') || q.includes('hydrat') || q.includes('ನೀರು') || q.includes('ಕುಡಿ') || q.includes('ದಾಹ') || q.includes('neer') || q.includes('kudi') || q.includes('पानी') || q.includes('प्यास') || q.includes('पीना')) {
    if (language === 'Kannada') {
      return ['ಹೌದು, ಸ್ವಲ್ಪ ನೀರು ಕೊಡಿ', 'ಇಲ್ಲ, ನಾನು ಆರಾಮಾಗಿದ್ದೇನೆ', 'ಸ್ವಲ್ಪ ನೀರು ಕೊಡ್ತೀರಾ?'];
    } else if (language === 'Hindi') {
      return ['हाँ, थोड़ा पानी देना!', 'नहीं, मैं ठीक हूँ', 'थोड़ा पानी पिला दो'];
    }
    return ['Yeah, water please!', "Nah, I'm good right now", 'Could you give me a sip?'];
  }

  // 2. Comfort / Temperature / Position
  if (q.includes('comfort') || q.includes('hot') || q.includes('cold') || q.includes('warm') || q.includes('position') || q.includes('ಆರಾಮ') || q.includes('ಚಳಿ') || q.includes('ಬಿಸಿ') || q.includes('aram') || q.includes('chali') || q.includes('bisi') || q.includes('आराम') || q.includes('गर्मी') || q.includes('ठंड')) {
    if (language === 'Kannada') {
      return ['ನನಗೆ ಸಖತ್ ಆರಾಮಾಗಿದೆ!', 'ಸ್ವಲ್ಪ ಚಳಿ ಆಗ್ತಿದೆ', 'ಸ್ವಲ್ಪ ಸರಿ ಮಾಡಿ ಕೊಡಿ'];
    } else if (language === 'Hindi') {
      return ['सब एकदम बढ़िया है!', 'मुझे थोड़ी ठंड लग रही है', 'थोड़ा सही कर दो'];
    }
    return ["Yeah, I'm super comfortable!", "Feeling a bit chilly/warm", 'Could you shift me a bit?'];
  }

  // 3. Pain / Discomfort / Medicine / Doctor
  if (q.includes('pain') || q.includes('hurt') || q.includes('medici') || q.includes('doct') || q.includes('sick') || q.includes('ನೋವು') || q.includes('ಔಷಧಿ') || q.includes('ವೈದ್ಯ') || q.includes('nov') || q.includes('ausadhi') || q.includes('matre') || q.includes('दर्द') || q.includes('दवा') || q.includes('डॉक्टर')) {
    if (language === 'Kannada') {
      return ['ಅಯ್ಯೋ, ಸ್ವಲ್ಪ ನೋವಾಗ್ತಿದೆ', 'ಮಾತ್ರೆ ಕೊಡಿ ಪ್ಲೀಸ್', 'ಡಾಕ್ಟರ್‌ಗೆ ಫೋನ್ ಮಾಡ್ತೀರಾ?'];
    } else if (language === 'Hindi') {
      return ['अरे, थोड़ा दर्द हो रहा है', 'दवा दे दो प्लीज', 'डॉक्टर को फोन लगा दो'];
    }
    return ["Ouch, I'm hurting a bit", 'Yeah, time for my pills', 'Could you call the doc?'];
  }

  // 4a. Specific What Food / WH-Food Questions (What food do you want? / ഏನ್ ಊಟ ಬೇಕು?)
  if (q.includes('what food') || q.includes('what to eat') || q.includes('which food') || q.includes('en uuta') || q.includes('en oota') || q.includes('enu uuta') || q.includes('enu thindi') || q.includes('ಏನ್ ಊಟ') || q.includes('ಏನು ಊಟ') || q.includes('ಏನು ತಿಂಡಿ') || q.includes('ಏನ್ ಬೇಕು')) {
    if (language === 'Kannada') {
      return ['ನನಗೆ ದೋಸೆ ಅಥವಾ ಇಡ್ಲಿ ಬೇಕು', 'ನನಗೆ ಬಿಸಿ ಬಿಸಿ ಅನ್ನ ಮತ್ತು ಸಾರು ಬೇಕು', 'ನನಗೆ ಚಪಾತಿ ಬೇಕು', 'ಸ್ವಲ್ಪ ಲಘು ಆಹಾರ ಅಥವಾ ಹಣ್ಣು ಕೊಡಿ'];
    }
    return ['I want dosa or idli, please', 'I want hot rice and sambar', 'I want chapati and curry', 'Just light snacks or fruit'];
  }

  // 4b. Food / Eat / Hungry / Meal
  if (q.includes('eat') || q.includes('food') || q.includes('hungr') || q.includes('lunch') || q.includes('dinner') || q.includes('meal') || q.includes('ಊಟ') || q.includes('ಹಸಿವು') || q.includes('ಆಹಾರ') || q.includes('oota') || q.includes('thindi') || q.includes('hasi') || q.includes('tin')) {
    if (language === 'Kannada') {
      return ['ಹೌದು, ತುಂಬಾ ಹಸಿತಿದೆ!', 'ಇಲ್ಲ, ಆಮೇಲೆ ತಿಂತೀನಿ', 'ಸ್ವಲ್ಪ ಸ್ನ್ಯಾಕ್ಸ್ ಕೊಡಿ'];
    }
    return ["Yeah, I'm starving!", "Nah, not hungry yet", 'Just a small snack, thanks!'];
  }

  // 5. Toilet / Bathroom / Washroom
  if (q.includes('toilet') || q.includes('bathroom') || q.includes('washroom') || q.includes('ಶೌಚಾಲಯ') || q.includes('ಶೌಚ') || q.includes('washroom') || q.includes('शौचालय') || q.includes('बाथरूम')) {
    if (language === 'Kannada') {
      return ['ನನಗೆ ವಾಶ್‌ರೂಮ್‌ಗೆ ಹೋಗಬೇಕು', 'ಇಲ್ಲ, ಈಗ ಬೇಡ', 'ಸ್ವಲ್ಪ ಹೆಲ್ಪ್ ಮಾಡಿ'];
    } else if (language === 'Hindi') {
      return ['मुझे वॉशरूम जाना है', 'नहीं, अभी नहीं', 'थोड़ी मदद कर दो'];
    }
    return ['I need to use the washroom', 'Nope, not right now', 'Could you help me walk there?'];
  }

  // 6. Rest / Sleep / Bed / Tired
  if (q.includes('rest') || q.includes('sleep') || q.includes('bed') || q.includes('tir') || q.includes('ವಿಶ್ರಾಂತಿ') || q.includes('ನಿದ್ರೆ') || q.includes('ಹಾಸಿಗೆ') || q.includes('visranthi') || q.includes('nidre') || q.includes('malag') || q.includes('सोना') || q.includes('आराम') || q.includes('थका')) {
    if (language === 'Kannada') {
      return ['ಹೌದು, ಸ್ವಲ್ಪ ಮಲಗ್ತೀನಿ', 'ನಾನು ಫುಲ್ ಆರಾಮ್!', 'ಹಾಸಿಗೆ ಸ್ವಲ್ಪ ಸರಿ ಮಾಡಿ'];
    } else if (language === 'Hindi') {
      return ['हाँ, थोड़ा लेटना चाहता हूँ', 'मैं एकदम फर्स्ट क्लास हूँ!', 'बिस्तर ठीक कर दो'];
    }
    return ["Yeah, gonna lie down for a bit", "Nah, I'm full of energy!", 'Could you fluff my pillow?'];
  }

  // 7. Time / Clock
  if (q.includes('time') || q.includes('clock') || q.includes('hour') || q.includes('ಸಮಯ') || q.includes('ಗಂಟೆ') || q.includes('samaya') || q.includes('gante') || q.includes('समय')) {
    if (language === 'Kannada') {
      return ['ಸಮಯ ಎಷ್ಟಾಯಿತು?', 'ಇನ್ನೂ ಸಮಯವಿದೆ', 'ನನಗೆ ಗೊತ್ತಿಲ್ಲ'];
    } else if (language === 'Hindi') {
      return ['कितने बजे हैं?', 'अभी समय है', 'मुझे नहीं पता'];
    }
    return ['What time is it?', 'Is it afternoon already?', 'I am not sure'];
  }

  // 8. TV / Music / Entertainment / Watch / Media
  if (q.includes('tv') || q.includes('movie') || q.includes('show') || q.includes('song') || q.includes('music') || q.includes('watch') || q.includes('ಟಿವಿ') || q.includes('ಹಾಡು') || q.includes('ನೋಡು') || q.includes('nodu') || q.includes('nodabeka') || q.includes('टीवी') || q.includes('गाना')) {
    if (language === 'Kannada') {
      return ['ನನಗೆ ಟಿವಿ ನೋಡಬೇಕು', 'ಸ್ವಲ್ಪ ಮ್ಯೂಸಿಕ್ ಪ್ಲೇ ಮಾಡಿ', 'ಬೇಡ, ವಿಶ್ರಾಂತಿ ಪಡೆಯುತ್ತೇನೆ'];
    } else if (language === 'Hindi') {
      return ['टीवी चला दो प्लीज', 'थोड़ा गाना बजा दो', 'नहीं, अभी शांत रहने दो'];
    }
    return ['Could you turn on the TV?', 'Play some nice music', 'No, keep it quiet please'];
  }

  // 9. Tea / Coffee / Beverages
  if (q.includes('tea') || q.includes('coffee') || q.includes('chai') || q.includes('ಚಹಾ') || q.includes('ಕಾಫಿ') || q.includes('chaha') || q.includes('चाय') || q.includes('कॉफ़ी')) {
    if (language === 'Kannada') {
      return ['ಹೌದು, ಚಹಾ ಕೊಡಿ!', 'ನನಗೆ ಕಾಫಿ ಇಷ್ಟ', 'ಇಲ್ಲ, ಬರಿ ನೀರು ಸಾಕು'];
    } else if (language === 'Hindi') {
      return ['हाँ, चाय दे दो!', 'मुझे कॉफ़ी पसंद है', 'नहीं, सिर्फ पानी चलेगा'];
    }
    return ['Yeah, I would love some tea!', 'Coffee sounds great!', 'Nah, just water for me'];
  }

  // 10. Walk / Outdoor / Garden
  if (q.includes('walk') || q.includes('outside') || q.includes('garden') || q.includes('stroll') || q.includes('ನಡಿಗೆ') || q.includes('ಹೊರಗೆ') || q.includes('horage') || q.includes('nadigi') || q.includes('टहलना') || q.includes('बाहर')) {
    if (language === 'Kannada') {
      return ['ಹೊರಗೆ ನಡಿಗೆಗೆ ಹೋಗೋಣ!', 'ಇಲ್ಲ, ಒಳಗಡೆಯೇ ಇರ್ತೀನಿ', 'ಸ್ವಲ್ಪ ಹೆಲ್ಪ್ ಮಾಡಿ'];
    } else if (language === 'Hindi') {
      return ['बाहर टहलने चलते हैं!', 'नहीं, अंदर ही ठीक हूँ', 'थोड़ी मदद कर दो'];
    }
    return ['I would love to take a walk outside!', "Nah, I'd rather stay inside", 'Could you help me walk?'];
  }

  // 12. Travel / Destination / Location / Mandya / City
  if (q.includes('mandya') || q.includes('barta') || q.includes('yavaga') || q.includes('travel') || q.includes('city') || q.includes('place') || q.includes('ಮಂಡ್ಯ') || q.includes('ಯಾವಾಗ') || q.includes('ಪ್ರಯಾಣ') || q.includes('ಸ್ಥಳ')) {
    if (language === 'Kannada') {
      return ['ನಾಳೆ ಮಂಡ್ಯಗೆ ಹೋಗೋಣ!', 'ನಾನು ಶೀಘ್ರದಲ್ಲೇ ಬರುತ್ತೇನೆ', 'ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ತೀರ್ಮಾನಿಸೋಣ'];
    } else if (language === 'Hindi') {
      return ['कल मंड्या चलेंगे!', 'मैं जल्द ही आऊँगा', 'थोड़ी देर बाद तय करते हैं'];
    }
    return ['Let us go to Mandya tomorrow!', "I will be coming very soon", 'Let us decide in a little while'];
  }

  // 13. Family Members (Son, Daughter, Spouse, Relative)
  if (q.includes('maga') || q.includes('magalu') || q.includes('hendthi') || q.includes('ganda') || q.includes('son') || q.includes('daughter') || q.includes('wife') || q.includes('husband') || q.includes('ಮಗ') || q.includes('ಮಗಳು') || q.includes('ಗಂಡ') || q.includes('ಹೆಂಡತಿ')) {
    if (language === 'Kannada') {
      return ['ಅವರಿಗೆ ಫೋನ್ ಮಾಡಿ ಮಾತನಾಡಿ!', 'ಅವರು ಯಾವಾಗ ಬರ್ತಾರೆ?', 'ನಾನು ಅವರೊಂದಿಗೆ ಮಾತನಾಡಬೇಕು'];
    } else if (language === 'Hindi') {
      return ['उन्हें फोन लगा दो!', 'वे कब आ रहे हैं?', 'मुझे उनसे बात करनी है'];
    }
    return ['Please call them right now!', 'When are they visiting?', 'I would love to talk to them'];
  }

  // 14. Specific Foods (Rice, Dosa, Idli, Roti, Fruits, Milk)
  if (q.includes('rice') || q.includes('dosa') || q.includes('idli') || q.includes('roti') || q.includes('fruit') || q.includes('milk') || q.includes('anna') || q.includes('dosae') || q.includes('haalu') || q.includes('hannu') || q.includes('ಅನ್ನ') || q.includes('ದೋಸೆ') || q.includes('ಇಡ್ಲಿ') || q.includes('ಹಾಲು') || q.includes('ಹಣ್ಣು')) {
    if (language === 'Kannada') {
      return ['ಹೌದು, ದೋಸೆ/ಇಡ್ಲಿ ಕೊಡಿ!', 'ನನಗೆ ಬಿಸಿ ಬಿಸಿ ಹಾಲು ಬೇಕು', 'ಸ್ವಲ್ಪ ಹಣ್ಣುಗಳನ್ನು ಕತ್ತರಿಸಿ ಕೊಡಿ'];
    } else if (language === 'Hindi') {
      return ['हाँ, डोसा/इडली दे दो!', 'मुझे गरम दूध चाहिए', 'थोड़ा फल काट कर दे दो'];
    }
    return ['Yes, I would love dosa/idli!', 'Please give me warm milk', 'Could I get some fresh fruit?'];
  }

  // 15. Body Parts / Symptoms (Headache, Stomach, Leg, Arm)
  if (q.includes('head') || q.includes('stomach') || q.includes('leg') || q.includes('arm') || q.includes('tale') || q.includes('hotte') || q.includes('kaalu') || q.includes('kai') || q.includes('ತಲೆ') || q.includes('ಹೊಟ್ಟೆ') || q.includes('ಕಾಲು') || q.includes('ಕೈ')) {
    if (language === 'Kannada') {
      return ['ನನಗೆ ಸ್ವಲ್ಪ ತಲೆನೋವು ಆಗ್ತಿದೆ', 'ಹೊಟ್ಟೆ ಸರಿ ಇಲ್ಲ', 'ಕಾಲುಗಳನ್ನು ಸ್ವಲ್ಪ ಮಸಾಜ್ ಮಾಡಿ'];
    } else if (language === 'Hindi') {
      return ['मुझे थोड़ा सिरदर्द हो रहा है', 'पेट ठीक नहीं लग रहा', 'पैरों की मालिश कर दो'];
    }
    return ['I have a slight headache', 'My stomach feels uneasy', 'Could you massage my legs?'];
  }

  // 16. Fan / AC / Blanket / Pillow / Chair
  if (q.includes('fan') || q.includes('ac') || q.includes('blanket') || q.includes('pillow') || q.includes('chair') || q.includes('dimbu') || q.includes('hodike') || q.includes('ಫ್ಯಾನ್') || q.includes('ದಿಂಬು') || q.includes('ಹೊದಿಕೆ') || q.includes('ಕುರ್ಚಿ')) {
    if (language === 'Kannada') {
      return ['ಫ್ಯಾನ್ ಆನ್/ಆಫ್ ಮಾಡಿ ಪ್ಲೀಸ್', 'ಹೊದಿಕೆ ಸ್ವಲ್ಪ ಸರಿ ಮಾಡಿ', 'ದಿಂಬು ಎತ್ತರಕ್ಕೆ ಇಡಿ'];
    } else if (language === 'Hindi') {
      return ['पंखा चला/बंद कर दो', 'कंबल सही कर दो', 'तकिया थोड़ा ऊपर कर दो'];
    }
    return ['Turn the fan on/off please', 'Adjust my blanket please', 'Fluff my pillow higher'];
  }

  // 17. Bath / Shower / Clean / Hygiene
  if (q.includes('bath') || q.includes('shower') || q.includes('wash') || q.includes('clean') || q.includes('snana') || q.includes('ಸ್ನಾನ') || q.includes('ಕೈ ತೊಳೆಯಿರಿ')) {
    if (language === 'Kannada') {
      return ['ನನಗೆ ಸ್ನಾನ ಮಾಡಬೇಕು', 'ಕೈ ತೊಳೆಯಲು ಸಹಾಯ ಮಾಡಿ', 'ಟವೆಲ್ ಕೊಡಿ ಪ್ಲೀಸ್'];
    } else if (language === 'Hindi') {
      return ['मुझे स्नान करना है', 'हाथ धोने में मदद करो', 'तौलिया दे दो प्लीज'];
    }
    return ['I want to take a bath/shower', 'Help me wash my hands', 'Hand me the towel please'];
  }

  // 18. Devotional / Music / Bhajans / Songs
  if (q.includes('bhajan') || q.includes('devotional') || q.includes('god') || q.includes('bhakthi') || q.includes('ದೇವರು') || q.includes('ಭಕ್ತಿ') || q.includes('ಹಾಡು')) {
    if (language === 'Kannada') {
      return ['ಭಕ್ತಿ ಗೀತೆಗಳನ್ನು ಪ್ಲೇ ಮಾಡಿ', 'ದೇವರ ಪ್ರಾರ್ಥನೆ ಮಾಡೋಣ', 'ಶಾಂತವಾದ ಹಾಡುಗಳನ್ನು ಹಾಕಿ'];
    } else if (language === 'Hindi') {
      return ['भक्ति भजन चला दो', 'भगवान की प्रार्थना करते हैं', 'शांत संगीत बजा दो'];
    }
    return ['Play some devotional songs', 'Let us pray together', 'Put on soft relaxing music'];
  }

  // 19. Time of Day (Morning, Evening, Night, Tomorrow)
  if (q.includes('morning') || q.includes('evening') || q.includes('night') || q.includes('tomorrow') || q.includes('beligge') || q.includes('ratri') || q.includes('naale') || q.includes('ಬೆಳಿಗ್ಗೆ') || q.includes('ಸಂಜೆ') || q.includes('ರಾತ್ರಿ') || q.includes('ನಾಳೆ')) {
    if (language === 'Kannada') {
      return ['ಶುಭ ಬೆಳಿಗ್ಗೆ/ಸಂಜೆ!', 'ನಾಳೆ ಬೆಳಿಗ್ಗೆ ನೋಡೋಣ', 'ರಾತ್ರಿ ಬೇಗ ಮಲಗೋಣ'];
    } else if (language === 'Hindi') {
      return ['शुभ प्रभात/संध्या!', 'कल सुबह देखते हैं', 'रात को जल्दी सोयेंगे'];
    }
    return ['Good morning/evening to you!', 'Let us talk tomorrow morning', 'I will sleep early tonight'];
  }

  // 20. Gratitude & Courtesy (Thank you, Please, Namaskara)
  if (q.includes('thanks') || q.includes('thank') || q.includes('please') || q.includes('dhanyavada') || q.includes('namaskara') || q.includes('ಧನ್ಯವಾದಗಳು') || q.includes('ನಮಸ್ಕಾರ')) {
    if (language === 'Kannada') {
      return ['ತುಂಬಾ ಧನ್ಯವಾದಗಳು!', 'ನಮಸ್ಕಾರ, ನೀವು ತುಂಬಾ ಒಳ್ಳೆಯವರು', 'ಪರವಾಯಿಲ್ಲ, ಧನ್ಯವಾದಗಳು'];
    } else if (language === 'Hindi') {
      return ['बहुत बहुत धन्यवाद!', 'नमस्कार, आप बहुत अच्छे हैं', 'कोई बात नहीं, शुक्रिया'];
    }
    return ['Thank you so much!', 'You are very kind, thanks!', 'My pleasure, thank you!'];
  }

  // 21. Wellbeing & Activity Check (How are you? What are you doing? / ಚೆನ್ನಾಗಿದ್ದೀಯಾ? ಏನ್ ಮಾಡ್ತಾ ಇದ್ದೀಯಾ?)
  if (q.includes('how are you') || q.includes('doing') || q.includes('hal') || q.includes('chennagiddiya') || q.includes('madtha') || q.includes('hegiddiya') || q.includes('ಚೆನ್ನಾಗಿದ್ದೀಯಾ') || q.includes('ಏನ್ ಮಾಡ್ತಾ') || q.includes('ಹೇಗಿದ್ದೀಯಾ') || q.includes('ಏನು ಸಮಾಚಾರ')) {
    if (language === 'Kannada') {
      return ['ಚೆನ್ನಾಗಿದ್ದೀನಿ, ವಿಶ್ರಾಂತಿ ತಗೋತಾ ಇದ್ದೀನಿ', 'ಟಿವಿ ನೋಡ್ತಾ ಇದ್ದೀನಿ', 'ಊಟ ಮಾಡ್ತಾ ಇದ್ದೀನಿ', 'ನನಗೆ ಸ್ವಲ್ಪ ಆರಾಮ ಇಲ್ಲ'];
    } else if (language === 'Hindi') {
      return ['मैं ठीक हूँ, आराम कर रहा हूँ', 'टीवी देख रहा हूँ', 'खाना खा रहा हूँ', 'मेरी तबियत थोड़ी ठीक नहीं है'];
    }
    return ["I'm doing well, just resting", "I'm watching TV right now", "I'm having a meal", "I'm not feeling very well"];
  }

  // 22. Smart Contextual Fallback for any custom prompt
  if (language === 'Kannada') {
    return [
      'ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ, ಧನ್ಯವಾದಗಳು!',
      'ಚೆನ್ನಾಗಿದ್ದೀನಿ, ವಿಶ್ರಾಂತಿ ತಗೋತಾ ಇದ್ದೀನಿ',
      'ಟಿವಿ ನೋಡ್ತಾ ಇದ್ದೀನಿ',
      'ನನಗೆ ಸಹಾಯ ಬೇಕು'
    ];
  } else if (language === 'Hindi') {
    return [
      'मैं ठीक हूँ, धन्यवाद!',
      'मैं आराम कर रहा हूँ',
      'टीवी देख रहा हूँ',
      'मुझे मदद चाहिए'
    ];
  }
  return [
    'I am doing fine, thank you!',
    'I am just resting right now',
    'I am watching TV',
    'Could you please help me out?'
  ];
};

export const ConversationModeModule = ({
  onBackToDashboard,
  patientId,
  patientName = 'Patient',
  onOpenProfile,
  onLogout
}) => {
  const { voiceAssistant, speak } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Status: 'idle' | 'listening' | 'processing' | 'recognized' | 'confirming' | 'synthesizing' | 'completed' | 'error'
  const [status, setStatus] = useState('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  // Ephemeral State
  const [isListening, setIsListening] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recognizedQuestion, setRecognizedQuestion] = useState('');
  const [responseChoices, setResponseChoices] = useState([]);
  const [selectedChoice, setSelectedChoice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [playbackResult, setPlaybackResult] = useState(null);
  const [isAutoReplyEnabled, setIsAutoReplyEnabled] = useState(true);

  const [deviceStatus, setDeviceStatus] = useState(() => deviceService.getDeviceStatus());
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const autoClearTimeoutRef = useRef(null);

  useEffect(() => {
    const unsubscribe = deviceService.subscribe((newStatus) => {
      setDeviceStatus(newStatus);
    });
    return () => {
      unsubscribe();
      if (autoClearTimeoutRef.current) clearTimeout(autoClearTimeoutRef.current);
    };
  }, []);

  // Automatic Ephemeral Cleanup
  const resetEphemeralState = () => {
    setRecognizedQuestion('');
    setResponseChoices([]);
    setSelectedChoice('');
    setPlaybackResult(null);
    setErrorMessage('');
    setStatus('idle');
    setStatusMessage('');
  };

  // Automatic Reply Execution Routine upon Speech Recognition
  const executeAutoReply = async (choiceText) => {
    if (!choiceText || !choiceText.trim()) return;
    setSelectedChoice(choiceText);
    setIsSynthesizing(true);
    setStatus('synthesizing');
    setStatusMessage(`⚡ Auto-Reply: Recognized! Synthesizing patient voice audio for "${choiceText}"...`);

    try {
      const result = await voiceService.playSynthesizedAudio({
        patientId: patientId || '',
        text: choiceText,
        language: selectedLanguage,
        emotion: 'neutral',
      });

      setPlaybackResult(result);
      setStatus('completed');
      setStatusMessage(`⚡ Auto-Reply Delivered via ${result?.provider || 'ElevenLabs Voice Engine'}`);

      autoClearTimeoutRef.current = setTimeout(() => {
        resetEphemeralState();
      }, 3500);
    } catch (err) {
      console.error('Auto-Reply Voice Output Error:', err);
      setErrorMessage(`Auto-reply voice output notice: ${err.message}`);
      setStatus('completed');
      autoClearTimeoutRef.current = setTimeout(() => {
        resetEphemeralState();
      }, 4000);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Start Companion Recording
  const startListening = async () => {
    resetEphemeralState();
    if (autoClearTimeoutRef.current) clearTimeout(autoClearTimeoutRef.current);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Microphone is not supported in this browser.');
      showTemporaryError('Microphone is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }

        const chunks = audioChunksRef.current;
        if (!chunks || chunks.length === 0) {
          showTemporaryError("Could not hear speech. Please try again.");
          return;
        }

        setStatus('processing');
        setStatusMessage('Transcribing companion speech with ElevenLabs Scribe v2 STT...');

        try {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audioSample', audioBlob, 'companion_speech.webm');
          formData.append('language', selectedLanguage === 'Kannada' ? 'kn' : 'en');

          const response = await voiceService.transcribeSpeech(formData);
          const transcript = response?.data?.text || response?.text || '';

          const rawText = (transcript || '').trim();
          const defaultPrompt = selectedLanguage === 'Kannada' ? 'ಧ್ವನಿ ಪ್ರಯತ್ನ ಗ್ರಹಿಸಲಾಗಿದೆ' : selectedLanguage === 'Hindi' ? 'वाणी प्रयास पहचाना गया' : 'Speech Vocalization Triggered';
          const cleanText = rawText
            .replace(/\[(pause|silence|cough|sigh|snort|laughter|music|clearing|throat-clearing|applause|cheering|noise|static)\]/gi, '')
            .replace(/^\[.*\]$/, '')
            .replace(/\s+/g, ' ')
            .trim() || defaultPrompt;

          setRecognizedQuestion(cleanText);

          let choices = [];
          try {
            const langCode = selectedLanguage === 'Kannada' ? 'kn' : selectedLanguage === 'Hindi' ? 'hi' : 'en';
            const aiRes = await contextService.generateOptions({ caregiverQuestion: cleanText, language: langCode });
            const optList = aiRes?.options || aiRes?.data?.options || [];
            if (Array.isArray(optList) && optList.length > 0) {
              choices = optList.map((opt) => (typeof opt === 'string' ? opt : opt.text || opt.rawText));
            }
          } catch (aiErr) {
            console.warn('AI Context Engine notice:', aiErr.message);
          }

          if (!choices || choices.length === 0) {
            choices = generateDynamicResponses(cleanText, selectedLanguage);
          }

          setResponseChoices(choices);

          if (isAutoReplyEnabled && choices.length > 0) {
            executeAutoReply(choices[0]);
          } else {
            setStatus('recognized');
            setStatusMessage('Speech attempt detected. Select your response below.');
          }
        } catch (sttErr) {
          console.error('ElevenLabs Scribe v2 STT Error:', sttErr.message);
          showTemporaryError(`Speech recognition failed: ${sttErr.message}`);
        } finally {
          setIsListening(false);
        }
      };

      mediaRecorder.start(250);
      setIsListening(true);
      setStatus('listening');
      setStatusMessage('Listening to companion speech...');
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone Access Error:', err);
      showTemporaryError('Microphone access denied or unavailable.');
    }
  };

  const stopListening = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error stopping MediaRecorder:', e);
      }
    }
  };

  const showTemporaryError = (msg) => {
    setErrorMessage(msg);
    setStatus('error');
    setIsListening(false);
    autoClearTimeoutRef.current = setTimeout(() => {
      resetEphemeralState();
    }, 3500);
  };

  const handleSelectChoice = (choiceText) => {
    setSelectedChoice(choiceText);
    setStatus('confirming');
    setStatusMessage('Choice selected. Press CONFIRM to generate speech and send to speaker.');
  };

  const handleResetSelection = () => {
    setSelectedChoice('');
    setStatus('recognized');
    setStatusMessage('Choice cleared. Select a response below.');
  };

  const handleConfirmAndSpeak = async () => {
    if (!selectedChoice || !selectedChoice.trim()) return;

    setIsSynthesizing(true);
    setStatus('synthesizing');
    setStatusMessage('Synthesizing patient voice audio and routing to physical speaker...');

    try {
      const result = await voiceService.playSynthesizedAudio({
        patientId: patientId || '',
        text: selectedChoice,
        language: selectedLanguage,
        emotion: 'neutral',
      });

      setPlaybackResult(result);
      setStatus('completed');
      setStatusMessage(`Audio output completed via: ${result?.provider || 'Physical Speaker'}`);

      // AUTOMATIC EPHEMERAL CLEANUP AFTER SUCCESSFUL PLAYBACK
      autoClearTimeoutRef.current = setTimeout(() => {
        resetEphemeralState();
      }, 3000);
    } catch (err) {
      console.error('Voice Output Error:', err);
      setErrorMessage(`Voice output notice: ${err.message}`);
      setStatus('completed');
      autoClearTimeoutRef.current = setTimeout(() => {
        resetEphemeralState();
      }, 4000);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="app-viewport">
      <div className="mobile-container dashboard-container" style={{ maxWidth: '520px' }}>
        
        {/* HEADER BAR */}
        <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="settings-btn"
              aria-label="Return to Dashboard"
              title="Return to Dashboard"
              onClick={onBackToDashboard}
            >
              <ArrowLeft size={22} />
            </button>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
              Ephemeral Conversation
            </h2>
          </div>

          <button
            type="button"
            className="settings-btn"
            aria-label="Open Settings"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings size={20} />
          </button>
        </header>

        {/* BLE DEVICE STATUS BAR */}
        <div
          style={{
            padding: '0.6rem 0.85rem',
            borderRadius: '14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Radio size={18} color={deviceStatus.isConnected ? '#16A34A' : '#DC2626'} />
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: deviceStatus.isConnected ? '#16A34A' : '#DC2626' }}>
              {deviceStatus.isConnected ? '🟢 VoiceBack-Neckband Connected' : '🔴 Device Disconnected'}
            </span>
          </div>

          {!deviceStatus.isConnected && (
            <button
              type="button"
              className="btn-secondary-auth"
              style={{ width: 'auto', padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
              onClick={() => deviceService.requestAndConnectBluetooth().catch((e) => console.warn(e.message))}
            >
              <span>Connect</span>
            </button>
          )}
        </div>

        {/* ERROR DISPLAY */}
        {errorMessage && (
          <div
            style={{
              padding: '0.75rem 0.9rem',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#DC2626',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.4rem',
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          
          {/* LANGUAGE & AUTO-REPLY CONTROL */}
          <section className="profile-section-card" style={{ padding: '0.75rem 0.9rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Globe size={16} color="var(--color-blue-primary)" />
                <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
                  Target Language
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {['English', 'Kannada'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSelectedLanguage(lang)}
                    style={{
                      padding: '0.35rem 0.6rem',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: selectedLanguage === lang ? 'var(--color-blue-primary)' : 'var(--border-color)',
                      background: selectedLanguage === lang ? 'rgba(2, 132, 199, 0.12)' : '#ffffff',
                      color: selectedLanguage === lang ? 'var(--color-blue-primary)' : 'var(--color-brand-tagline)',
                      fontWeight: selectedLanguage === lang ? 700 : 500,
                      fontSize: '0.775rem',
                      cursor: 'pointer',
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} color={isAutoReplyEnabled ? '#16A34A' : '#64748B'} />
                <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
                  ⚡ Auto-Reply on Recognition
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAutoReplyEnabled(!isAutoReplyEnabled)}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: isAutoReplyEnabled ? '#16A34A' : '#E2E8F0',
                  color: isAutoReplyEnabled ? '#FFFFFF' : '#475569',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {isAutoReplyEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </section>

          {/* COMPANION SPEECH CAPTURE ACTION */}
          <section className="profile-section-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 className="profile-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mic size={18} color="var(--color-blue-primary)" />
                <span>Listen to Companion</span>
              </h3>
              {recognizedQuestion && (
                <button
                  type="button"
                  onClick={resetEphemeralState}
                  style={{ border: 'none', background: 'transparent', color: 'var(--color-brand-tagline)', cursor: 'pointer' }}
                  title="Clear temporary interaction"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {isListening ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1rem 0' }}>
                <div className="listening-pulse-stage" style={{ margin: 0 }}>
                  <div className="listening-icon-circle">
                    <Mic size={32} strokeWidth={2.5} />
                  </div>
                  <div className="listening-pulse-ring-anim" />
                </div>
                <span style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'monospace' }}>
                  {formatTime(recordingTime)}
                </span>
                <button
                  type="button"
                  className="btn-continue"
                  onClick={stopListening}
                  style={{ width: '100%', background: '#EF4444', borderColor: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Square size={18} />
                  <span>Stop Listening</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-continue"
                onClick={startListening}
                disabled={status === 'processing' || isSynthesizing}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Mic size={18} />
                <span>{status === 'processing' ? 'Processing Speech...' : 'Start Listening to Companion Speech'}</span>
              </button>
            )}
          </section>

          {/* ULTRA IMPRESSIVE EPHEMERAL QUESTION & RESPONSE PANEL */}
          {recognizedQuestion && (
            <div className="ultra-ephemeral-panel">
              {/* HEADER BADGE & CLOSE */}
              <div className="ultra-ephemeral-header">
                <div className="ultra-pill-badge">
                  <div className="soundwave-bars">
                    <span className="soundwave-bar" />
                    <span className="soundwave-bar" />
                    <span className="soundwave-bar" />
                    <span className="soundwave-bar" />
                  </div>
                  <span>SPEECH RECOGNIZED</span>
                </div>
                <button
                  type="button"
                  onClick={resetEphemeralState}
                  style={{ border: 'none', background: 'transparent', color: 'var(--color-brand-tagline)', cursor: 'pointer', opacity: 0.75 }}
                  title="Clear interaction"
                >
                  <X size={18} />
                </button>
              </div>

              {/* RECOGNIZED QUESTION TEXT */}
              <div>
                <span style={{ fontSize: '0.725rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-brand-tagline)', display: 'block', marginBottom: '0.25rem' }}>
                  Person Said:
                </span>
                <p style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--color-brand-title)', margin: 0, lineHeight: 1.35, letterSpacing: '-0.01em' }}>
                  "{recognizedQuestion}"
                </p>
              </div>

              {/* DYNAMIC RESPONSE CHOICES */}
              {responseChoices.length > 0 && !selectedChoice && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-brand-title)', margin: 0 }}>
                    What would you like to say? (Tap a choice)
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {responseChoices.map((choiceText, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectChoice(choiceText)}
                        style={{
                          padding: '0.9rem 1.1rem',
                          borderRadius: '16px',
                          border: '1.5px solid var(--border-color)',
                          background: 'rgba(255, 255, 255, 0.9)',
                          color: 'var(--color-brand-title)',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span>{choiceText}</span>
                        <CheckCircle2 size={19} color="var(--color-blue-primary)" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CONFIRMATION STAGE */}
              {selectedChoice && (
                <div className="ultra-response-box">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-blue-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Sparkles size={15} />
                      Selected Response (Patient Voice Output):
                    </span>
                    {isSynthesizing && (
                      <div className="soundwave-bars">
                        <span className="soundwave-bar" />
                        <span className="soundwave-bar" />
                        <span className="soundwave-bar" />
                        <span className="soundwave-bar" />
                      </div>
                    )}
                  </div>

                  <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-brand-title)', margin: '0.2rem 0 0.6rem 0', lineHeight: 1.3 }}>
                    "{selectedChoice}"
                  </p>

                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    <button
                      type="button"
                      className="ultra-btn-confirm"
                      onClick={handleConfirmAndSpeak}
                      disabled={isSynthesizing}
                    >
                      <Check size={20} />
                      <span>{isSynthesizing ? 'SYNTHESIZING...' : 'CONFIRM'}</span>
                    </button>

                    <button
                      type="button"
                      className="ultra-btn-change"
                      onClick={handleResetSelection}
                      disabled={isSynthesizing}
                    >
                      <RefreshCw size={16} />
                      <span>CHANGE</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STATUS & PLAYBACK RESULT */}
          {statusMessage && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '12px',
                background: 'rgba(241, 245, 249, 0.9)',
                border: '1px solid var(--border-color)',
                fontSize: '0.8rem',
                color: 'var(--color-brand-tagline)',
                textAlign: 'center',
                fontWeight: 600,
              }}
            >
              Status: {statusMessage}
            </div>
          )}

          {playbackResult && (
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '14px',
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1.5px solid var(--color-green-primary)',
                color: 'var(--color-green-primary)',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <Volume2 size={20} />
              <span>{playbackResult.provider}</span>
            </div>
          )}

        </main>
      </div>

      <SettingsBottomSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default ConversationModeModule;
