import secrets
from django.conf import settings
from django.contrib.auth import get_user_model
from google_auth_oauthlib.flow import Flow
from django.core.exceptions import SuspiciousOperation
from django.contrib.auth import login
from google.oauth2 import id_token
from google.auth.transport import requests

User = get_user_model()


GOOGLE_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]


def create_google_flow():
    client_config = {
        "web": {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [settings.GOOGLE_REDIRECT_URI],
        }
    }

    flow = Flow.from_client_config(
        client_config,
        scopes=GOOGLE_SCOPES,
        redirect_uri=settings.GOOGLE_REDIRECT_URI,
    )

    return flow



def create_google_authorization_url():
    flow = create_google_flow()

    state = secrets.token_urlsafe(32)

    authorization_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="select_account",
        state=state,
    )

    return authorization_url, state, flow.code_verifier




def handle_google_callback(request):
    state = request.session.get("google_oauth_state")

    if not state:
        raise SuspiciousOperation("Missing Google OAuth state.")

    returned_state = request.GET.get("state")

    if not returned_state or returned_state != state:
        raise SuspiciousOperation("Invalid Google OAuth state.")

    error = request.GET.get("error")

    if error:
        raise SuspiciousOperation(
            f"Google OAuth authorization failed: {error}"
        )

    authorization_code = request.GET.get("code")

    if not authorization_code:
        raise SuspiciousOperation("Missing Google authorization code.")

    flow = create_google_flow()
    code_verifier = request.session.get("google_oauth_code_verifier")

    if not code_verifier:
        raise SuspiciousOperation("Missing Google OAuth code verifier.")

    flow.code_verifier = code_verifier
    flow.fetch_token(code=authorization_code)

    credentials = flow.credentials
    google_request = requests.Request()

    id_info = id_token.verify_oauth2_token(
        credentials.id_token,
        google_request,
        settings.GOOGLE_CLIENT_ID,
    )

    google_email = id_info.get("email")
    google_name = id_info.get("name", "")
    email_verified = id_info.get("email_verified", False)

    if not google_email or not email_verified:
        raise SuspiciousOperation(
            "Google account email could not be verified."
        )

    google_email = google_email.lower().strip()

    user = User.objects.filter(email=google_email).first()

    if user is None:
        user = User(
            email=google_email,
            full_name=google_name or google_email.split("@")[0],
            email_verified=True,
        )
        user.set_unusable_password()
        user.save()
    else:
        if not user.email_verified:
            user.email_verified = True
            user.save(update_fields=["email_verified"])

    login(request, user)

    request.session.pop("google_oauth_state", None)
    request.session.pop("google_oauth_code_verifier", None)

    return user