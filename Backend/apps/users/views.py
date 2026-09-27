from django.shortcuts import render
from django.http import HttpResponseRedirect
from .google_auth import create_google_authorization_url
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView 
from django.shortcuts import redirect
from .google_auth import handle_google_callback

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        authorization_url, state, code_verifier = create_google_authorization_url()

        request.session["google_oauth_state"] = state
        request.session["google_oauth_code_verifier"] = code_verifier

        return HttpResponseRedirect(authorization_url)


class GoogleCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        handle_google_callback(request)

        return redirect("http://localhost:5173/")