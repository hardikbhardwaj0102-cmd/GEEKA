from django.conf import settings

from brevo import Brevo
from brevo.transactional_emails import (
    SendTransacEmailRequestSender,
    SendTransacEmailRequestToItem,
)


SENDER_EMAIL = "geekashop.official@gmail.com"
SENDER_NAME = "GEEKA"


def send_verification_email(email, otp):
    client = Brevo(api_key=settings.BREVO_API_KEY)

    client.transactional_emails.send_transac_email(
        subject="Verify your GEEKA account",
        html_content=f"""
        <html>
            <body>
                <h2>Verify your GEEKA account</h2>

                <p>Your verification code is:</p>

                <h1>{otp}</h1>

                <p>This code will expire in 10 minutes.</p>

                <p>
                    If you did not create a GEEKA account,
                    you can safely ignore this email.
                </p>

                <p>Regards,<br>GEEKA</p>
            </body>
        </html>
        """,
        sender=SendTransacEmailRequestSender(
            name=SENDER_NAME,
            email=SENDER_EMAIL,
        ),
        to=[
            SendTransacEmailRequestToItem(
                email=email,
            )
        ],
    )