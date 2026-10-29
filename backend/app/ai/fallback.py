import re

# Rule-based fallback keyword mapping for home services
SERVICE_KEYWORDS = {
    "Plumbing": [
        "tap", "faucet", "leak", "leaking", "pipe", "drain", "clog", "clogged", "sink",
        "toilet", "flush", "water", "shower", "sewer", "basin", "geyser leak", "valve"
    ],
    "Electrical": [
        "wire", "wiring", "switch", "short circuit", "spark", "socket", "plug", "fuse",
        "mcb", "tripping", "light", "bulb", "fan", "power cut", "fixture", "voltage"
    ],
    "Carpentry": [
        "door", "wood", "wooden", "latch", "hinge", "furniture", "table", "chair",
        "cupboard", "cabinet", "bed", "drawer", "shelf", "carpenter"
    ],
    "Cleaning": [
        "clean", "cleaning", "dust", "dusting", "wash", "stain", "sofa clean",
        "deep clean", "mop", "sanitization", "bathroom clean", "kitchen clean"
    ],
    "AC Service": [
        "ac", "air conditioner", "cooling", "ac leak", "compressor", "filter",
        "split ac", "window ac", "gas refill", "ac noise", "not cooling"
    ],
    "Appliance Repair": [
        "refrigerator", "fridge", "washing machine", "microwave", "oven", "tv",
        "television", "dishwasher", "chimney", "water purifier", "ro repair", "grinder"
    ],
    "Painting": [
        "paint", "painting", "wall", "color", "whitewash", "primer", "waterproofing",
        "dampness", "patch work", "wall repaint"
    ],
    "Locksmith": [
        "lock", "key", "keyhole", "locked out", "lock replacement", "padlock",
        "door lock", "duplicate key", "handle lock", "vault lock"
    ]
}

SAFETY_WARNINGS = {
    "Electrical": "⚠️ Safety First: Turn off the main circuit breaker before touching any exposed wiring or sparkling sockets.",
    "Plumbing": "⚠️ Quick Action: Turn off the main water shut-off valve to prevent water damage while waiting for the plumber.",
    "AC Service": "⚠️ Notice: Keep the AC power unplugged if you notice burning smell or electrical buzzing.",
    "Appliance Repair": "⚠️ Precaution: Unplug the appliance from the electrical socket before inspecting.",
    "Gas/Fire": "🚨 EMERGENCY DANGER: If you smell gas or notice smoke/fire, evacuate immediately and call emergency services!"
}

LOCALIZED_SERVICE_NAMES = {
    "en": {
        "Plumbing": "Plumbing",
        "Electrical": "Electrical",
        "Carpentry": "Carpentry",
        "Cleaning": "Cleaning",
        "AC Service": "AC Service",
        "Appliance Repair": "Appliance Repair",
        "Painting": "Painting",
        "Locksmith": "Locksmith",
        "Other Home Services": "Other Home Services",
    },
    "ta": {
        "Plumbing": "பிளம்பிங்",
        "Electrical": "மின் பழுது",
        "Carpentry": "கார்பென்ட்ரி",
        "Cleaning": "சுத்தம்",
        "AC Service": "ஏசி சர்வீஸ்",
        "Appliance Repair": "சாதன பழுது",
        "Painting": "வண்ணம்/சுவர்பணிகள்",
        "Locksmith": "லாக்ஸ்மித்",
        "Other Home Services": "மற்ற வீட்டு சேவைகள்",
    },
    "hi": {
        "Plumbing": "प्लंबिंग",
        "Electrical": "बिजली",
        "Carpentry": "कारपेंट्री",
        "Cleaning": "सफाई",
        "AC Service": "एसी सर्विस",
        "Appliance Repair": "उपकरण मरम्मत",
        "Painting": "पेंटिंग",
        "Locksmith": "लॉकस्मिथ",
        "Other Home Services": "अन्य घरेलू सेवाएं",
    },
}

LOCALIZED_SEVERITY = {
    "en": {"Low": "Low", "Medium": "Medium", "High": "High", "Emergency": "Emergency"},
    "ta": {"Low": "குறைந்த", "Medium": "மிதமான", "High": "உயர்ந்த", "Emergency": "அவசரம்"},
    "hi": {"Low": "कम", "Medium": "मध्यम", "High": "उच्च", "Emergency": "आपातकाल"},
}

LOCALIZED_SAFETY_WARNINGS = {
    "en": SAFETY_WARNINGS,
    "ta": {
        "Electrical": "⚠️ பாதுகாப்பு முதல்: வெளிப்படும் வயரிங் அல்லது மின்னல் பொருட்களை தொடுவதற்கு முன் முக்கிய சர்க்யூட் பிரேக்கரை அணைக்கவும்.",
        "Plumbing": "⚠️ உடனடி நடவடிக்கை: பிளம்பர் வருவதற்கு முன் முக்கிய நீர் மூடு வால்வை நிறுத்துங்கள், தண்ணீர் சேதம் தவிர்க்கப்படும்.",
        "AC Service": "⚠️ எச்சரிக்கை: எரியும் வாசனை அல்லது மின்சார இரைச்சல் இருந்தால் ஏசியின் மின்சாரத்தை துண்டிக்கவும்.",
        "Appliance Repair": "⚠️ முன்னெச்சரிக்கை: பரிசோதிப்பதற்கு முன் சாதனத்தை மின் குழாயிலிருந்து துண்டிக்கவும்.",
        "Gas/Fire": "🚨 அவசர ஆபத்து: எரிவாயு அல்லது புகை/தீயை உணர்ந்தால் உடனடியாக வெளியேறி அவசர சேவைகளை அழைக்கவும்!"
    },
    "hi": {
        "Electrical": "⚠️ सुरक्षा पहले: खुले तार या चमकते सॉकेट को छूने से पहले मुख्य सर्किट ब्रेकर बंद करें।",
        "Plumbing": "⚠️ तुरंत कार्रवाई: प्लंबर आने तक मुख्य पानी का शट-ऑफ वाल्व बंद करें ताकि पानी की क्षति न हो।",
        "AC Service": "⚠️ ध्यान दें: जलने की गंध या विद्युत आवाज़ हो तो AC का बिजली स्रोत काट दें।",
        "Appliance Repair": "⚠️ सावधानी: जाँच से पहले उपकरण को बिजली से अलग करें।",
        "Gas/Fire": "🚨 आपातकालीन खतरा: अगर आपको गैस या धुआँ/आग महसूस हो तो तुरंत निकलें और आपातकालीन सेवाओं को कॉल करें!"
    },
}


def get_localized_service_name(service_name, language="en"):
    language = language if language in LOCALIZED_SERVICE_NAMES else "en"
    return LOCALIZED_SERVICE_NAMES[language].get(service_name, service_name)


def get_localized_severity(level, language="en"):
    language = language if language in LOCALIZED_SEVERITY else "en"
    return LOCALIZED_SEVERITY[language].get(level, level)


def get_localized_safety_tip(service_name, language="en"):
    language = language if language in LOCALIZED_SAFETY_WARNINGS else "en"
    return LOCALIZED_SAFETY_WARNINGS[language].get(service_name, SAFETY_WARNINGS.get(service_name, "⚠️ Please maintain safety while waiting for the technician."))


def analyze_problem_fallback(text, selected_service_id=None, service_names_map=None, language="en"):
    """
    Fallback AI analysis using pattern matching when AI_API_KEY is not configured.
    Returns structured analysis dict.
    """
    normalized_language = language if language in ["en", "ta", "hi"] else "en"
    text_lower = text.lower() if text else ""
    detected_service = "Other Home Services"
    highest_matches = 0

    for svc_name, keywords in SERVICE_KEYWORDS.items():
        matches = sum(1 for kw in keywords if re.search(r'\b' + re.escape(kw) + r'\b', text_lower))
        if matches > highest_matches:
            highest_matches = matches
            detected_service = svc_name

    # Determine severity
    severity = "Medium"
    if any(w in text_lower for w in ["spark", "fire", "burst", "emergency", "flooding", "broken lock", "hazard"]):
        severity = "High"
    elif any(w in text_lower for w in ["slight", "minor", "squeak", "loose", "dirty"]):
        severity = "Low"

    # Troubleshooting & response creation
    troubleshooting_steps = []
    if detected_service == "Plumbing":
        troubleshooting_steps = [
            "Check if the main water shutoff valve near the sink or meter is open.",
            "Place a bucket under leaking pipes to prevent floor damage.",
            "Avoid dumping harsh corrosive chemicals down clogged drains."
        ]
    elif detected_service == "Electrical":
        troubleshooting_steps = [
            "Check your main DB box to see if the MCB switch tripped.",
            "Unplug high-load devices connected to the affected outlet.",
            "Do NOT attempt to touch exposed live wires."
        ]
    elif detected_service == "AC Service":
        troubleshooting_steps = [
            "Clean or inspect the removable front air filter mesh.",
            "Ensure remote control batteries are fresh and thermostat is set to Cool.",
            "Check if the outdoor unit fan is rotating freely."
        ]
    elif detected_service == "Locksmith":
        troubleshooting_steps = [
            "Check if key is inserted fully without bending.",
            "Apply graphite lubricant or oil to sticky keyways gently.",
            "Do not force stuck keys to avoid snapping inside the cylinder."
        ]
    else:
        troubleshooting_steps = [
            "Inspect the area for any immediate hazards.",
            "Gather any relevant product model or fixture details.",
            "Keep the area accessible for the technician."
        ]

    localized_steps = {
        "en": troubleshooting_steps,
        "ta": [
            "முக்கிய நீர் மூடு வால்வு திறந்துள்ளதா என்பதை சரிபார்க்கவும்.",
            "கசிவு கொண்ட குழாயின் கீழே தண்ணீர் பிடிக்கும் பாத்திரத்தை வைக்கவும்.",
            "சிறிய அசுத்தமான கடைகளை கொதிக்க வைக்க வேண்டாம்."
        ],
        "hi": [
            "मुख्य पानी का शट-ऑफ वाल्व सही स्थिति में है या नहीं देखें।",
            "टपकते पाइप के नीचे बाल्टी रखें ताकि फर्श को नुकसान न हो।",
            "भरी हुई नालियों में कठोर रसायन न डालें।"
        ],
    }
    if detected_service == "Electrical":
        localized_steps["ta"] = [
            "मुख्य DB बॉक्स में MCB स्विच ट्रिप हुआ है या नहीं சரிபார்க்கவும்.",
            "பாதிக்கப்பட்ட அவுட்லெட்டுடன் இணைக்கப்பட்ட உயர்-சுமை சாதனங்களை துண்டிக்கவும்.",
            "வெளிப்படும் மின் வயரிங்கை தொட முயற்சிக்க வேண்டாம்."
        ]
        localized_steps["hi"] = [
            "मुख्य DB बॉक्स में MCB स्विच ट्रिप हुआ है या नहीं देखें।",
            "प्रभावित आउटलेट से जुड़े हाई-लोड उपकरण अलग करें।",
            "खुले विद्युत तार को हाथ न लगाएं।"
        ]
    elif detected_service == "AC Service":
        localized_steps["ta"] = [
            "நீக்கக்கூடிய முன் ஏர் ஃபில்டர் மென்சை சுத்தம் செய்யவும்.",
            "ரிமோட் கண்ட்ரோல் பேட்டரி மற்றும் தெர்மோஸ்டேட் Cool அமைப்பை சரிபார்க்கவும்.",
            "வெளிப்புற அலகின் பவர் ஃபேன் சுதந்திரமாக சுழல்கிறதா பார்க்கவும்."
        ]
        localized_steps["hi"] = [
            "हटाने योग्य सामने का एयर फिल्टर साफ करें।",
            "रिमोट की बैटरी और थर्मोस्टेट को Cool पर सेट देखें।",
            "बाहरी यूनिट का फैन सही तरीके से घूम रहा है या नहीं देखें।"
        ]
    elif detected_service == "Locksmith":
        localized_steps["ta"] = [
            "கீ முழுமையாக செருகப்பட்டுள்ளதா சோதிக்கவும்.",
            "சட்டையான கீவாய்களில் கிராஃபைட் லூப்ரிகண்ட் அல்லது எண்ணெய் பயன்படுத்தவும்.",
            "சிக்கிய கீயை வலுக்கட்டாயமாக இழுக்க வேண்டாம்."
        ]
        localized_steps["hi"] = [
            "चाबी पूरी तरह से लगी है या नहीं देखें।",
            "स्टिक कुंजी मार्ग में ग्रेफाइट लुब्रिकेंट लगाएं।",
            "फंसी चाबी को मजबूरी में खींचें नहीं।"
        ]
    elif detected_service == "Other Home Services":
        localized_steps["ta"] = [
            "பிரச்சனை உள்ள பகுதியை உடனடியாக பரிசோதிக்கவும்.",
            "தேவையான தயாரிப்பு மாதிரி அல்லது சாதன விவரங்களை சேகரிக்கவும்.",
            "தொழில்முறை உதவிக்கு இடம் எளிதாக கிடைப்பதை உறுதிசெய்யவும்."
        ]
        localized_steps["hi"] = [
            "क्षेत्र में तत्काल खतरे की जांच करें।",
            "उपयुक्त उत्पाद मॉडल या फिक्सचर की जानकारी इकट्ठा करें।",
            "तकनीशियन के लिए जगह साफ और पहुँच योग्य रखें।"
        ]

    # Check for wrong-service mismatch
    is_mismatch = False
    mismatch_warning = ""
    if selected_service_id and service_names_map:
        user_chosen_name = service_names_map.get(selected_service_id)
        if user_chosen_name and user_chosen_name != detected_service and detected_service != "Other Home Services":
            is_mismatch = True
            mismatch_warning = f"Notice: You selected '{user_chosen_name}', but your problem description points to '{detected_service}'."
            if normalized_language == "ta":
                mismatch_warning = f"கவனிக்கவும்: நீங்கள் '{user_chosen_name}' என்பதை தேர்ந்தெடுத்தீர்கள்; ஆனால் உங்கள் பிரச்சனை விவரம் '{get_localized_service_name(detected_service, 'ta')}'க்கு சுட்டிக்காட்டுகிறது."
            elif normalized_language == "hi":
                mismatch_warning = f"नोटिस: आपने '{user_chosen_name}' चुना है, लेकिन आपके समस्या विवरण में '{get_localized_service_name(detected_service, 'hi')}' का संकेत है।"

    safety_tip = get_localized_safety_tip(detected_service, normalized_language)
    localized_service_name = get_localized_service_name(detected_service, normalized_language)
    if normalized_language == "ta":
        ai_response_text = f"பிரச்சனை ஆய்வு செய்யப்பட்டது: '{text}'. பரிந்துரைக்கப்பட்ட சேவை: {localized_service_name}. {safety_tip}"
    elif normalized_language == "hi":
        ai_response_text = f"समस्या का विश्लेषण किया गया: '{text}'. सुझाई गई सेवा: {localized_service_name}. {safety_tip}"
    else:
        ai_response_text = f"Analyzed issue: '{text}'. Recommended Service: {localized_service_name}. {safety_tip}"

    return {
        "is_fallback": True,
        "mode": "Demo/Fallback Rule-Based Mode",
        "language": normalized_language,
        "detected_problem": text[:150] if text else "Home service issue",
        "detected_service": detected_service,
        "severity": get_localized_severity(severity, normalized_language),
        "requires_professional": True,
        "troubleshooting_steps": localized_steps.get(normalized_language, troubleshooting_steps),
        "safety_tip": safety_tip,
        "is_service_mismatch": is_mismatch,
        "mismatch_warning": mismatch_warning,
        "ai_response": ai_response_text
    }
