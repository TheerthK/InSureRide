"""
InSureRide — Chatbot Response Loader
Reads response templates from templates/chat/{intent}/{lang}.txt
Falls back to English if the target language file is missing.
"""
import os

from config import TEMPLATES_DIR

CHAT_TEMPLATES_DIR = os.path.join(TEMPLATES_DIR, "chat")


def load_response(intent: str, lang: str = "en") -> str:
    """
    Load a response template for the given intent and language.

    Falls back to English if the target language template is missing.
    Falls back to a generic message if English is also missing.
    """
    # Try the requested language first
    path = os.path.join(CHAT_TEMPLATES_DIR, intent, f"{lang}.txt")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return f.read().strip()

    # Fallback to English
    path_en = os.path.join(CHAT_TEMPLATES_DIR, intent, "en.txt")
    if os.path.exists(path_en):
        with open(path_en, "r", encoding="utf-8") as f:
            return f.read().strip()

    # Final fallback
    return _get_hardcoded_fallback(intent, lang)


def _get_hardcoded_fallback(intent: str, lang: str) -> str:
    """
    Hardcoded fallback responses in case template files are missing.
    These cover all 10 intents × 6 languages.
    """
    fallbacks = {
        "greeting": {
            "en": "Hello! 👋 Welcome to InSureRide. How can I help you today?",
            "hi": "नमस्ते! 👋 InSureRide में आपका स्वागत है। मैं आज आपकी कैसे मदद कर सकता हूँ?",
            "ta": "வணக்கம்! 👋 InSureRide-க்கு வரவேற்கிறோம். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
            "te": "నమస్కారం! 👋 InSureRide కి స్వాగతం. ఈ రోజు నేను మీకు ఎలా సహాయం చేయగలను?",
            "kn": "ನಮಸ್ಕಾರ! 👋 InSureRide ಗೆ ಸ್ವಾಗತ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
            "bn": "নমস্কার! 👋 InSureRide-এ স্বাগতম। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
        },
        "claim_status": {
            "en": "Let me check your latest claim status. Your most recent claim is being processed. You'll receive a notification once it's updated.",
            "hi": "मैं आपके नवीनतम दावे की स्थिति जाँच रहा हूँ। आपका सबसे हालिया दावा प्रक्रियाधीन है। अपडेट होने पर आपको सूचना मिलेगी।",
            "ta": "உங்கள் சமீபத்திய கோரிக்கையின் நிலையை சரிபார்க்கிறேன். உங்கள் சமீபத்திய கோரிக்கை செயலாக்கப்படுகிறது. புதுப்பிக்கப்பட்டவுடன் அறிவிப்பு வரும்.",
            "te": "మీ తాజా క్లెయిమ్ స్థితిని తనిఖీ చేస్తున్నాను. మీ ఇటీవలి క్లెయిమ్ ప్రాసెస్ అవుతోంది. అప్డేట్ అయినప్పుడు నోటిఫికేషన్ వస్తుంది.",
            "kn": "ನಿಮ್ಮ ಇತ್ತೀಚಿನ ಕ್ಲೈಮ್ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸುತ್ತಿದ್ದೇನೆ. ನಿಮ್ಮ ಇತ್ತೀಚಿನ ಕ್ಲೈಮ್ ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ. ನವೀಕರಿಸಿದಾಗ ನಿಮಗೆ ಅಧಿಸೂಚನೆ ಬರುತ್ತದೆ.",
            "bn": "আপনার সাম্প্রতিক দাবির স্থিতি পরীক্ষা করছি। আপনার সাম্প্রতিক দাবিটি প্রক্রিয়াধীন রয়েছে। আপডেট হলে বিজ্ঞপ্তি পাবেন।",
        },
        "payout_time": {
            "en": "Payouts are typically credited within 2 hours of claim approval. If your claim is approved, check your UPI app — the amount should arrive shortly!",
            "hi": "दावा स्वीकृत होने के 2 घंटे के भीतर भुगतान आमतौर पर क्रेडिट हो जाता है। अपना UPI ऐप चेक करें — राशि जल्द ही आ जाएगी!",
            "ta": "கோரிக்கை அங்கீகரிக்கப்பட்ட 2 மணி நேரத்திற்குள் பணம் வழக்கமாக வரவு வைக்கப்படும். உங்கள் UPI ஆப்பை சரிபார்க்கவும் — தொகை விரைவில் வரும்!",
            "te": "క్లెయిమ్ ఆమోదించిన 2 గంటల్లో చెల్లింపులు సాధారణంగా క్రెడిట్ అవుతాయి. మీ UPI యాప్ చూడండి — మొత్తం త్వరలో వస్తుంది!",
            "kn": "ಕ್ಲೈಮ್ ಅನುಮೋದನೆಯ 2 ಗಂಟೆಗಳ ಒಳಗೆ ಪಾವತಿಗಳು ಸಾಮಾನ್ಯವಾಗಿ ಕ್ರೆಡಿಟ್ ಆಗುತ್ತವೆ. ನಿಮ್ಮ UPI ಅಪ್ಲಿಕೇಶನ್ ಪರಿಶೀಲಿಸಿ — ಮೊತ್ತವು ಶೀಘ್ರದಲ್ಲೇ ಬರುತ್ತದೆ!",
            "bn": "দাবি অনুমোদনের ২ ঘণ্টার মধ্যে পেমেন্ট সাধারণত ক্রেডিট হয়। আপনার UPI অ্যাপ দেখুন — টাকা শীঘ্রই আসবে!",
        },
        "why_rejected": {
            "en": "Claims can be rejected if: (1) Our fraud detection found anomalies, (2) The disruption didn't meet the trigger threshold, or (3) Your policy wasn't active during the event. You can appeal by completing a quick sync-up verification.",
            "hi": "दावे अस्वीकृत हो सकते हैं यदि: (1) हमारे फ्रॉड डिटेक्शन ने विसंगतियाँ पाईं, (2) व्यवधान ट्रिगर सीमा तक नहीं पहुँचा, या (3) घटना के दौरान आपकी पॉलिसी सक्रिय नहीं थी। सिंक-अप सत्यापन पूरा करके अपील कर सकते हैं।",
            "ta": "கோரிக்கைகள் நிராகரிக்கப்படலாம்: (1) எங்கள் மோசடி கண்டறிதல் முரண்பாடுகளைக் கண்டறிந்தது, (2) இடையூறு தூண்டுதல் வரம்பை எட்டவில்லை, அல்லது (3) நிகழ்வின் போது உங்கள் பாலிசி செயலில் இல்லை. விரைவான சிங்க்-அப் சரிபார்ப்பு மூலம் மேல்முறையீடு செய்யலாம்.",
            "te": "క్లెయిమ్‌లు తిరస్కరించబడవచ్చు: (1) మా ఫ్రాడ్ డిటెక్షన్ అసాధారణతలను కనుగొంది, (2) అంతరాయం ట్రిగ్గర్ థ్రెషోల్డ్‌ను చేరుకోలేదు, లేదా (3) ఈవెంట్ సమయంలో మీ పాలసీ యాక్టివ్‌గా లేదు.",
            "kn": "ಕ್ಲೈಮ್‌ಗಳನ್ನು ತಿರಸ್ಕರಿಸಬಹುದು: (1) ನಮ್ಮ ಫ್ರಾಡ್ ಡಿಟೆಕ್ಷನ್ ಅಸಹಜತೆಗಳನ್ನು ಕಂಡುಹಿಡಿದಿದೆ, (2) ಅಡ್ಡಿ ಟ್ರಿಗ್ಗರ್ ಮ ಕ್ಕುತ್ತಿಲ್ಲ, ಅಥವಾ (3) ಘಟನೆಯ ಸಮಯದಲ್ಲಿ ನಿಮ್ಮ ಪಾಲಿಸಿ ಸಕ್ರಿಯವಾಗಿಲ್ಲ.",
            "bn": "দাবি প্রত্যাখ্যান হতে পারে: (1) আমাদের জালিয়াতি সনাক্তকরণ অসঙ্গতি পেয়েছে, (2) ব্যাঘাতটি ট্রিগার সীমায় পৌঁছায়নি, বা (3) ঘটনার সময় আপনার পলিসি সক্রিয় ছিল না।",
        },
        "how_to_refer": {
            "en": "Share your referral code with other riders! Both you and your friend get ₹50 off next week's premium. Go to Profile → Referral Code to find and share your code.",
            "hi": "अपना रेफ़रल कोड अन्य राइडर्स के साथ साझा करें! आपको और आपके दोस्त दोनों को अगले सप्ताह के प्रीमियम पर ₹50 की छूट मिलेगी।",
            "ta": "உங்கள் ரெஃபரல் குறியீட்டை மற்ற ரைடர்களுடன் பகிரவும்! நீங்களும் உங்கள் நண்பரும் அடுத்த வார பிரீமியத்தில் ₹50 தள்ளுபடி பெறுவீர்கள்.",
            "te": "మీ రెఫరల్ కోడ్‌ను ఇతర రైడర్లతో షేర్ చేయండి! మీరు మరియు మీ స్నేహితుడు ఇద్దరికీ వచ్చే వారం ప్రీమియంపై ₹50 తగ్గింపు.",
            "kn": "ನಿಮ್ಮ ರೆಫರಲ್ ಕೋಡ್ ಅನ್ನು ಇತರ ರೈಡರ್‌ಗಳೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ! ನೀವು ಮತ್ತು ನಿಮ್ಮ ಸ್ನೇಹಿತ ಇಬ್ಬರೂ ಮುಂದಿನ ವಾರದ ಪ್ರೀಮಿಯಂನಲ್ಲಿ ₹50 ರಿಯಾಯಿತಿ ಪಡೆಯುತ್ತೀರಿ.",
            "bn": "আপনার রেফারেল কোডটি অন্য রাইডারদের সাথে শেয়ার করুন! আপনি এবং আপনার বন্ধু উভয়েই পরের সপ্তাহের প্রিমিয়ামে ₹50 ছাড় পাবেন।",
        },
        "change_language": {
            "en": "You can change your language in Profile → Settings. We support: English, Hindi, Tamil, Telugu, Kannada, and Bengali.",
            "hi": "आप प्रोफ़ाइल → सेटिंग्स में अपनी भाषा बदल सकते हैं। हम समर्थन करते हैं: English, हिंदी, தமிழ், తెలుగు, ಕನ್ನಡ, বাংলা।",
            "ta": "சுயவிவரம் → அமைப்புகளில் மொழியை மாற்றலாம். நாங்கள் ஆதரிக்கிறோம்: English, हिंदी, தமிழ், తెలుగు, ಕನ್ನಡ, বাংলা.",
            "te": "ప్రొఫైల్ → సెట్టింగ్స్‌లో భాషను మార్చుకోండి. మేము మద్దతు ఇస్తాము: English, हिंदी, தமிழ், తెలుగు, ಕನ್ನಡ, বাংলা.",
            "kn": "ಪ್ರೊಫೈಲ್ → ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ ಭಾಷೆ ಬದಲಾಯಿಸಿ. ನಾವು ಬೆಂಬಲಿಸುತ್ತೇವೆ: English, हिंदी, தமிழ், తెలుగు, ಕನ್ನಡ, বাংলা.",
            "bn": "প্রোফাইল → সেটিংসে ভাষা পরিবর্তন করুন। আমরা সমর্থন করি: English, हिंदी, தமிழ், తెలుగు, ಕನ್ನಡ, বাংলা।",
        },
        "file_manual_claim": {
            "en": "I can help you file a manual claim. Please describe what happened: (1) What type of issue? (2) When did it occur? (3) Do you have any photos? Your claim will be reviewed within 72 hours.",
            "hi": "मैं आपको मैनुअल दावा दर्ज करने में मदद कर सकता हूँ। कृपया बताएं क्या हुआ: (1) किस प्रकार की समस्या? (2) कब हुई? (3) क्या आपके पास फ़ोटो हैं? 72 घंटों में समीक्षा होगी।",
            "ta": "கைமுறை கோரிக்கை தாக்கல் செய்ய உதவ முடியும். என்ன நடந்தது என விவரிக்கவும்: (1) என்ன வகையான பிரச்சனை? (2) எப்போது நடந்தது? (3) புகைப்படங்கள் உள்ளதா? 72 மணி நேரத்தில் மதிப்பாய்வு செய்யப்படும்.",
            "te": "మాన్యువల్ క్లెయిమ్ ఫైల్ చేయడంలో సహాయపడగలను. ఏమి జరిగిందో వివరించండి: (1) ఏ రకమైన సమస్య? (2) ఎప్పుడు జరిగింది? (3) ఫోటోలు ఉన్నాయా? 72 గంటల్లో సమీక్షించబడుతుంది.",
            "kn": "ಮ್ಯಾನ್ಯುಯಲ್ ಕ್ಲೈಮ್ ಫೈಲ್ ಮಾಡಲು ಸಹಾಯ ಮಾಡಬಹುದು. ಏನಾಯಿತು ಎಂದು ವಿವರಿಸಿ: (1) ಯಾವ ರೀತಿಯ ಸಮಸ್ಯೆ? (2) ಯಾವಾಗ ನಡೆಯಿತು? (3) ಫೋಟೋಗಳಿವೆಯೇ? 72 ಗಂಟೆಗಳಲ್ಲಿ ಪರಿಶೀಲಿಸಲಾಗುವುದು.",
            "bn": "ম্যানুয়াল দাবি ফাইল করতে সাহায্য করতে পারি। কী ঘটেছে বর্ণনা করুন: (1) কী ধরনের সমস্যা? (2) কখন ঘটেছে? (3) ফটো আছে? ৭২ ঘণ্টায় পর্যালোচনা হবে।",
        },
        "cancel_policy": {
            "en": "To cancel your policy, please confirm by saying 'Yes, cancel'. Note: Cancellation takes effect from next Monday. No refund for the current week's premium.",
            "hi": "अपनी पॉलिसी रद्द करने के लिए 'हाँ, रद्द करें' कहकर पुष्टि करें। नोट: अगले सोमवार से रद्दीकरण प्रभावी होगा। वर्तमान सप्ताह के प्रीमियम का रिफंड नहीं।",
            "ta": "உங்கள் பாலிசியை ரத்து செய்ய 'ஆம், ரத்து செய்' என்று உறுதிப்படுத்தவும். குறிப்பு: ரத்து அடுத்த திங்கள் முதல் நடைமுறைக்கு வரும்.",
            "te": "మీ పాలసీ రద్దు చేయడానికి 'అవును, రద్దు' అని నిర్ధారించండి. గమనిక: రద్దు వచ్చే సోమవారం నుండి అమలులోకి వస్తుంది.",
            "kn": "ನಿಮ್ಮ ಪಾಲಿಸಿ ರದ್ದುಗೊಳಿಸಲು 'ಹೌದು, ರದ್ದುಗೊಳಿಸಿ' ಎಂದು ದೃಢೀಕರಿಸಿ. ಸೂಚನೆ: ರದ್ದತಿ ಮುಂದಿನ ಸೋಮವಾರದಿಂದ ಜಾರಿಗೆ ಬರುತ್ತದೆ.",
            "bn": "আপনার পলিসি বাতিল করতে 'হ্যাঁ, বাতিল করুন' বলে নিশ্চিত করুন। দ্রষ্টব্য: বাতিলকরণ আগামী সোমবার থেকে কার্যকর হবে।",
        },
        "update_upi": {
            "en": "To update your UPI VPA, go to Profile → Payment Settings. Enter your new VPA (e.g., name@upi) and verify. Your payouts will be sent to the new VPA from the next claim.",
            "hi": "UPI VPA अपडेट करने के लिए प्रोफ़ाइल → भुगतान सेटिंग्स पर जाएँ। नया VPA दर्ज करें और सत्यापित करें।",
            "ta": "UPI VPA புதுப்பிக்க சுயவிவரம் → பணம் செலுத்தும் அமைப்புகளுக்கு செல்லவும். புதிய VPA உள்ளிட்டு சரிபார்க்கவும்.",
            "te": "UPI VPA అప్డేట్ చేయడానికి ప్రొఫైల్ → పేమెంట్ సెట్టింగ్స్‌కు వెళ్ళండి. కొత్త VPA నమోదు చేసి వెరిఫై చేయండి.",
            "kn": "UPI VPA ನವೀಕರಿಸಲು ಪ್ರೊಫೈಲ್ → ಪಾವತಿ ಸೆಟ್ಟಿಂಗ್‌ಗಳಿಗೆ ಹೋಗಿ. ಹೊಸ VPA ನಮೂದಿಸಿ ಮತ್ತು ಪರಿಶೀಲಿಸಿ.",
            "bn": "UPI VPA আপডেট করতে প্রোফাইল → পেমেন্ট সেটিংসে যান। নতুন VPA লিখুন এবং যাচাই করুন।",
        },
        "contact_human": {
            "en": "Let me connect you with a support agent. You can also reach us at support@insureride.in or call 1800-XXX-XXXX (toll-free). A human agent will respond within 30 minutes.",
            "hi": "मैं आपको सपोर्ट एजेंट से जोड़ रहा हूँ। आप support@insureride.in पर या 1800-XXX-XXXX (टोल-फ्री) पर कॉल कर सकते हैं। 30 मिनट में जवाब मिलेगा।",
            "ta": "ஆதரவு முகவருடன் இணைக்கிறேன். support@insureride.in அல்லது 1800-XXX-XXXX (இலவச அழைப்பு) தொடர்பு கொள்ளலாம். 30 நிமிடத்தில் பதில் வரும்.",
            "te": "సపోర్ట్ ఏజెంట్‌తో కనెక్ట్ చేస్తున్నాను. support@insureride.in లేదా 1800-XXX-XXXX (టోల్-ఫ్రీ)కు కాల్ చేయవచ్చు. 30 నిమిషాల్లో జవాబు వస్తుంది.",
            "kn": "ಬೆಂಬಲ ಏಜೆಂಟ್‌ಗೆ ಸಂಪರ್ಕಿಸುತ್ತಿದ್ದೇನೆ. support@insureride.in ಅಥವಾ 1800-XXX-XXXX (ಟೋಲ್-ಫ್ರೀ) ಕರೆ ಮಾಡಬಹುದು. 30 ನಿಮಿಷಗಳಲ್ಲಿ ಉತ್ತರ ಬರುತ್ತದೆ.",
            "bn": "সাপোর্ট এজেন্টের সাথে সংযুক্ত করছি। support@insureride.in বা 1800-XXX-XXXX (টোল-ফ্রি) কল করতে পারেন। ৩০ মিনিটে উত্তর পাবেন।",
        },
    }

    intent_responses = fallbacks.get(intent, fallbacks["contact_human"])
    return intent_responses.get(lang, intent_responses.get("en", "Please contact support."))
