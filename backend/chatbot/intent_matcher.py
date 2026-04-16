"""
InSureRide — Chatbot Intent Matcher
Keyword-based deterministic intent matching (no LLM needed).

Intents:
1. greeting           — hello, hi, namaste, vanakkam
2. claim_status       — claim, status, where, payout
3. payout_time        — when, time, how long, payout
4. why_rejected       — rejected, why, reason, denied
5. how_to_refer       — refer, friend, share, code
6. change_language    — language, bhasha, switch
7. file_manual_claim  — report, manual, issue, problem, file
8. cancel_policy      — cancel, stop, unsubscribe
9. update_upi         — upi, vpa, payment, update, change
10. contact_human     — human, agent, support, help, call
"""

# ── Keyword dictionaries per intent per language ─────────────────────────────
# Each intent has keywords in all 6 supported languages.

INTENT_KEYWORDS: dict[str, dict[str, list[str]]] = {
    "greeting": {
        "en": ["hello", "hi", "hey", "good morning", "good evening", "greetings"],
        "hi": ["namaste", "namaskar", "hello", "hi", "pranam"],
        "ta": ["vanakkam", "hello", "hi", "kalai vanakkam"],
        "te": ["namaskaram", "hello", "hi", "baagunnara"],
        "kn": ["namaskara", "hello", "hi", "shubhodaya"],
        "bn": ["nomoshkar", "hello", "hi", "kemon acho"],
    },
    "claim_status": {
        "en": ["claim", "status", "my claim", "claim status", "track", "check claim", "where is my claim"],
        "hi": ["dava", "claim", "status", "mera claim", "kahan", "claim kahan"],
        "ta": ["claim", "nilai", "en claim", "claim nilai", "eppo", "claim status"],
        "te": ["claim", "status", "na claim", "claim ekkada"],
        "kn": ["claim", "status", "nanna claim", "claim elli"],
        "bn": ["claim", "status", "amar claim", "claim kothay"],
    },
    "payout_time": {
        "en": ["when", "payout", "how long", "time", "money", "payment", "when will i get", "credited"],
        "hi": ["kab", "payout", "kitna time", "paisa", "payment", "kab milega"],
        "ta": ["eppothu", "payout", "evvalavu neram", "panam", "payment", "eppo varum"],
        "te": ["eppudu", "payout", "entha time", "dabbu", "payment", "eppudu vasthundi"],
        "kn": ["yavaga", "payout", "estu samaya", "hanavu", "payment", "yavaga baratte"],
        "bn": ["kokhon", "payout", "koto shomoy", "taka", "payment", "kokhon pabo"],
    },
    "why_rejected": {
        "en": ["rejected", "why", "reason", "denied", "not approved", "why rejected", "reject"],
        "hi": ["reject", "kyon", "karan", "mana", "approve nahi", "kyon reject"],
        "ta": ["reject", "yen", "karanam", "maruppu", "approve aagala", "yen reject"],
        "te": ["reject", "enduku", "karanam", "kakunda", "approve avaledu", "enduku reject"],
        "kn": ["reject", "yake", "karana", "nirakarana", "approve aagilla", "yake reject"],
        "bn": ["reject", "keno", "karon", "protirodh", "approve hoini", "keno reject"],
    },
    "how_to_refer": {
        "en": ["refer", "friend", "share", "code", "referral", "invite", "earn"],
        "hi": ["refer", "dost", "share", "code", "referral", "bulao", "kamao"],
        "ta": ["refer", "nanban", "share", "code", "referral", "azhaikkavum", "sambathikkavum"],
        "te": ["refer", "snehitudu", "share", "code", "referral", "piluvandi", "sampadhinchandi"],
        "kn": ["refer", "gelaya", "share", "code", "referral", "kari", "sampaadisi"],
        "bn": ["refer", "bondhu", "share", "code", "referral", "dako", "arjan koro"],
    },
    "change_language": {
        "en": ["language", "switch", "change language", "english", "hindi", "tamil"],
        "hi": ["bhasha", "badlo", "language", "hindi", "english", "tamil"],
        "ta": ["mozhi", "maatru", "language", "tamil", "english", "hindi"],
        "te": ["bhasha", "maarchu", "language", "telugu", "english", "hindi"],
        "kn": ["bhashe", "badale", "language", "kannada", "english", "hindi"],
        "bn": ["bhasha", "bodlao", "language", "bangla", "english", "hindi"],
    },
    "file_manual_claim": {
        "en": ["report", "manual", "issue", "problem", "file", "submit", "incident", "happened"],
        "hi": ["report", "manual", "samasya", "problem", "file", "submit", "ghatna", "hua"],
        "ta": ["report", "manual", "pirachanai", "problem", "file", "submit", "sambhavam", "nadanthathu"],
        "te": ["report", "manual", "samasya", "problem", "file", "submit", "ghatana", "jarigindi"],
        "kn": ["report", "manual", "samasye", "problem", "file", "submit", "ghatane", "aaytu"],
        "bn": ["report", "manual", "somossha", "problem", "file", "submit", "ghotona", "hoyeche"],
    },
    "cancel_policy": {
        "en": ["cancel", "stop", "unsubscribe", "end policy", "cancel policy", "don't want"],
        "hi": ["cancel", "band", "unsubscribe", "policy band", "cancel policy", "nahi chahiye"],
        "ta": ["cancel", "niruthu", "unsubscribe", "policy niruthu", "cancel policy", "vendaam"],
        "te": ["cancel", "aapandi", "unsubscribe", "policy aapandi", "cancel policy", "vaddu"],
        "kn": ["cancel", "nillisi", "unsubscribe", "policy nillisi", "cancel policy", "beda"],
        "bn": ["cancel", "bondho koro", "unsubscribe", "policy bondho", "cancel policy", "chai na"],
    },
    "update_upi": {
        "en": ["upi", "vpa", "payment", "update", "change upi", "new upi", "phone pe", "gpay"],
        "hi": ["upi", "vpa", "payment", "update", "upi badlo", "naya upi", "phone pe", "gpay"],
        "ta": ["upi", "vpa", "payment", "update", "upi maatru", "pudhu upi", "phone pe", "gpay"],
        "te": ["upi", "vpa", "payment", "update", "upi maarchu", "kotha upi", "phone pe", "gpay"],
        "kn": ["upi", "vpa", "payment", "update", "upi badale", "hosa upi", "phone pe", "gpay"],
        "bn": ["upi", "vpa", "payment", "update", "upi bodlao", "notun upi", "phone pe", "gpay"],
    },
    "contact_human": {
        "en": ["human", "agent", "support", "help", "call", "talk", "person", "customer care"],
        "hi": ["insaan", "agent", "support", "madad", "call", "baat", "vyakti", "customer care"],
        "ta": ["manidhan", "agent", "support", "udavi", "call", "pesu", "nbar", "customer care"],
        "te": ["manishi", "agent", "support", "sahayam", "call", "maatlaadu", "vyakti", "customer care"],
        "kn": ["manushya", "agent", "support", "sahaya", "call", "maatadu", "vyakti", "customer care"],
        "bn": ["manush", "agent", "support", "sahajjo", "call", "kotha bolo", "byakti", "customer care"],
    },
}


def match_intent(message: str, lang: str = "en") -> str:
    """
    Match a user message to an intent using keyword matching.

    Args:
        message: The user's message text.
        lang: Language code (en/hi/ta/te/kn/bn).

    Returns:
        Intent string (e.g., "claim_status", "greeting").
        Falls back to "contact_human" if no match found.
    """
    message_lower = message.lower().strip()

    # Score each intent by counting keyword matches
    best_intent = "contact_human"
    best_score = 0

    for intent, lang_keywords in INTENT_KEYWORDS.items():
        # Check keywords in the requested language + English fallback
        keywords = lang_keywords.get(lang, []) + lang_keywords.get("en", [])

        score = 0
        for keyword in keywords:
            if keyword.lower() in message_lower:
                # Longer keyword matches score higher (more specific)
                score += len(keyword.split())

        if score > best_score:
            best_score = score
            best_intent = intent

    return best_intent


# Suggested follow-up actions per intent
SUGGESTED_ACTIONS: dict[str, list[str]] = {
    "greeting": ["Check claim status", "File a claim", "Refer a friend"],
    "claim_status": ["View claim details", "Contact support"],
    "payout_time": ["Check claim status", "Update UPI"],
    "why_rejected": ["File appeal", "Contact support", "Sync-up verification"],
    "how_to_refer": ["Share referral code", "Check referral status"],
    "change_language": ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Bengali"],
    "file_manual_claim": ["Upload photo", "Describe issue", "Check claim status"],
    "cancel_policy": ["Confirm cancellation", "Talk to support"],
    "update_upi": ["Enter new UPI VPA", "Verify existing UPI"],
    "contact_human": ["Call support", "Email support", "Chat with agent"],
}


def get_suggested_actions(intent: str) -> list[str]:
    """Get suggested follow-up actions for an intent."""
    return SUGGESTED_ACTIONS.get(intent, ["Contact support"])
