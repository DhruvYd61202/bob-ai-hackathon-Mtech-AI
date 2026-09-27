"""
=============================================================================
DeepFake ForensicAI - IBM Bob Centralized Configuration
=============================================================================
This is the single centralized configuration file for IBM Bob.
IBM Bob operates as the load-bearing digital forensic reporting specialist.

Configuration:
- IBM Bob provides ONE API key.
- Simply paste that ONE key into IBM_BOB_API_KEY below.
=============================================================================
"""
import os

# Legacy placeholder text (only used if no key has been pasted yet)
BOB_KEY_PLACEHOLDER = "PASTE_YOUR_IBM_BOB_API_KEY_HERE"

# User's active IBM Bob API Key (paste your single key here)
IBM_BOB_API_KEY = "bob_prod_bob-admin_TrXTVwbgWZqtzZTwUP2LWgLCkGL6iKxfG3PCpZ3L3ECg2wo7zqNbEva8JFoqE2Va3tFVobFtmNKFZtMrVQ3k7X2_CB7St3qZkby3RZcjSAD8kFdvMW27nnDBrDCFdhJcuSYe"

# IBM Bob Service Endpoint (can be IBM Bob, local proxy, Watsonx, or custom)
IBM_BOB_ENDPOINT = os.getenv("IBM_BOB_ENDPOINT", "https://bob.ibm.com/api/v1")

# Default IBM Bob Forensic Model
IBM_BOB_MODEL = os.getenv("IBM_BOB_MODEL", "ibm-bob-forensic-v1")

# Request timeout in seconds
IBM_BOB_TIMEOUT_SECONDS = int(os.getenv("IBM_BOB_TIMEOUT_SECONDS", "10"))


def _is_usable_key(k: str) -> bool:
    """Helper to check if a candidate key string is an actual key and not unconfigured dummy text."""
    if not k:
        return False
    k = k.strip()
    if not k:
        return False
    # If the user left it as the dummy placeholder text
    if k.upper().startswith("PASTE_") or "YOUR_KEY" in k.upper() or "YOUR_IBM_BOB" in k.upper():
        return False
    # Any real key from IBM Bob (like bob_prod_bob-apikey_...)
    return len(k) > 8


def get_active_bob_key() -> str:
    """
    Retrieves the active API key (from config or environment), or empty string if not configured.
    Never exposes or logs this value.
    """
    # 1. Check primary IBM_BOB_API_KEY setting
    raw_key = (IBM_BOB_API_KEY or "").strip()
    if _is_usable_key(raw_key):
        return raw_key

    # 2. Check environment variable
    env_key = os.getenv("IBM_BOB_API_KEY", "").strip()
    if _is_usable_key(env_key):
        return env_key

    # 3. Fallback: if the user pasted their key into BOB_KEY_PLACEHOLDER
    placeholder_val = (BOB_KEY_PLACEHOLDER or "").strip()
    if _is_usable_key(placeholder_val):
        return placeholder_val

    return ""


def is_bob_configured() -> bool:
    """
    Checks if IBM Bob has been configured with an active API key.
    Returns True if a valid API key is present.
    """
    return bool(get_active_bob_key())
