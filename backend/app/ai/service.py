import os
import json
import requests
from app.ai.fallback import analyze_problem_fallback

AI_API_KEY = os.getenv("AI_API_KEY")
AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini") # gemini, openai, or auto


def analyze_user_input(text, input_type="text", image_url=None, selected_service_id=None, service_names_map=None, language="en"):
    """
    Analyzes customer input (text, image description, or voice transcript) using configured AI provider or Fallback logic.
    """
    normalized_language = language if language in ["en", "ta", "hi"] else "en"

    if not AI_API_KEY or len(AI_API_KEY.strip()) == 0:
        return analyze_problem_fallback(text, selected_service_id, service_names_map, normalized_language)

    try:
        # Attempt Gemini or OpenAI API call if key is provided
        language_name = {
            "en": "English",
            "ta": "Tamil",
            "hi": "Hindi",
        }[normalized_language]
        prompt = f"""
You are QuickMend's AI Home Service Diagnostic Assistant.
Customer Input ({input_type}): "{text}"
Image URL: {image_url or "None"}

Services Available:
- Electrical
- Plumbing
- Carpentry
- Cleaning
- AC Service
- Appliance Repair
- Painting
- Locksmith
- Other Home Services

Task:
1. Identify specific problem title.
2. Select the EXACT matching service from the 9 available services.
3. Assess severity (Low, Medium, High, Emergency).
4. Determine if professional assistance is required (true/false).
5. Provide 2-3 safe troubleshooting steps.
6. Provide a safety warning if applicable.
7. Respond entirely in {language_name}; do not use English except for service names when an exact service identifier is required.

Return ONLY a valid JSON object formatted as:
{{
  "detected_problem": "Short problem summary in {language_name}",
  "detected_service": "Exact Service Name",
  "severity": "Medium",
  "requires_professional": true,
  "troubleshooting_steps": ["step 1", "step 2"],
  "safety_tip": "Safety warning if any",
  "ai_response": "Polite summary to customer in {language_name}"
}}
"""
        # Call Gemini REST API directly
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={AI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        resp = requests.post(url, json=payload, timeout=8)
        if resp.status_code == 200:
            result_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            # Extract JSON block
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            
            data = json.loads(result_text)
            data["is_fallback"] = False
            data["mode"] = "AI Engine (Active)"
            data["language"] = normalized_language

            # Mismatch check
            if selected_service_id and service_names_map:
                chosen_name = service_names_map.get(selected_service_id)
                if chosen_name and chosen_name != data.get("detected_service"):
                    data["is_service_mismatch"] = True
                    data["mismatch_warning"] = f"Notice: You selected '{chosen_name}', but AI analyzed this as '{data.get('detected_service')}'."
                    if normalized_language == "ta":
                        data["mismatch_warning"] = f"கவனிக்கவும்: நீங்கள் '{chosen_name}' என்பதை தேர்ந்தெடுத்தீர்கள்; ஆனால் AI அதை '{data.get('detected_service')}' என்று பகுப்பாய்வு செய்துள்ளது."
                    elif normalized_language == "hi":
                        data["mismatch_warning"] = f"नोटिस: आपने '{chosen_name}' चुना है, लेकिन AI ने इसे '{data.get('detected_service')}' के रूप में विश्लेषित किया है।"
                else:
                    data["is_service_mismatch"] = False

            return data
    except Exception as e:
        print(f"AI API error: {e}, using fallback.")

    return analyze_problem_fallback(text, selected_service_id, service_names_map, normalized_language)
