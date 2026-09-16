"""Send transactional emails (verification, password reset)."""
import ssl
import aiosmtplib
from email.message import EmailMessage
from backend.config import settings


def _make_tls_context():
    """Create TLS context that accepts self-signed / invalid certs."""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


async def send_email(to: str, subject: str, body: str) -> bool:
    """Send an email via system SMTP. Returns True on success."""
    if not settings.smtp_host:
        # No SMTP configured — log to console (dev mode)
        print(f"[EMAIL] To: {to} | Subject: {subject}")
        print(f"[EMAIL] {body}")
        print(f"[EMAIL] ---")
        return True

    msg = EmailMessage()
    msg["From"] = settings.smtp_from
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)

    use_tls = not settings.smtp_tls   # implicit SSL (port 465)
    start_tls = settings.smtp_tls     # STARTTLS (port 587)
    tls_context = _make_tls_context() if (use_tls or start_tls) else None

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user or None,
            password=settings.smtp_password or None,
            use_tls=use_tls,
            start_tls=start_tls,
            tls_context=tls_context,
        )
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False


async def send_verification_email(to: str, token: str, lang: str = "en"):
    """Send email verification link."""
    link = f"{settings.base_url}/verify?token={token}"

    subjects = {
        "en": "Verify your SimpleRelay account",
        "pl": "Zweryfikuj swoje konto SimpleRelay",
    }

    bodies = {
        "en": f"Click to verify your email:\n\n{link}\n\nThis link expires in 24 hours.",
        "pl": f"Kliknij, aby zweryfikować swój e-mail:\n\n{link}\n\nLink jest ważny 24 godziny.",
    }

    await send_email(
        to,
        subjects.get(lang, subjects["en"]),
        bodies.get(lang, bodies["en"]),
    )


async def send_reset_email(to: str, token: str, lang: str = "en"):
    """Send password reset link."""
    link = f"{settings.base_url}/reset-password?token={token}"

    subjects = {
        "en": "Reset your SimpleRelay password",
        "pl": "Zresetuj swoje hasło SimpleRelay",
    }

    bodies = {
        "en": f"Click to reset your password:\n\n{link}\n\nThis link expires in 1 hour.",
        "pl": f"Kliknij, aby zresetować hasło:\n\n{link}\n\nLink jest ważny 1 godzinę.",
    }

    await send_email(
        to,
        subjects.get(lang, subjects["en"]),
        bodies.get(lang, bodies["en"]),
    )