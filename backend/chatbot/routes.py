"""
InSureRide — Chatbot API Route
POST /chat — Multilingual chatbot for rider queries.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db import get_db
from chatbot.intent_matcher import match_intent, get_suggested_actions
from chatbot.response_loader import load_response
from security.validation import ChatIn, ChatOut
from security.audit_log import write_audit

router = APIRouter(tags=["Chatbot"])


@router.post("/chat", response_model=ChatOut)
async def api_chat(body: ChatIn, db: Session = Depends(get_db)):
    """
    Multilingual chatbot for rider queries.

    Supported intents:
    - greeting, claim_status, payout_time, why_rejected
    - how_to_refer, change_language, file_manual_claim
    - cancel_policy, update_upi, contact_human

    Supported languages: en, hi, ta, te, kn, bn
    """
    intent = match_intent(body.message, body.lang)
    reply = load_response(intent, body.lang)
    suggested = get_suggested_actions(intent)

    write_audit(db, "RIDER", str(body.rider_id), "chat_message", {
        "message_preview": body.message[:100],
        "intent": intent,
        "lang": body.lang,
    })

    return ChatOut(
        reply=reply,
        intent=intent,
        suggested_actions=suggested,
    )
