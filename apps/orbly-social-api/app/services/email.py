from __future__ import annotations

import asyncio
import logging
import smtplib
from email.message import EmailMessage

from app.config import settings

logger = logging.getLogger(__name__)


def _smtp_configured() -> bool:
    return bool(settings.smtp_host and settings.email_from)


def _send_sync(*, to: str, subject: str, html: str, text: str) -> None:
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.email_from
    msg["To"] = to
    msg.set_content(text)
    msg.add_alternative(html, subtype="html")

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls()
        if settings.smtp_user and settings.smtp_password:
            smtp.login(settings.smtp_user, settings.smtp_password)
        smtp.send_message(msg)


async def send_password_reset_email(
    *,
    to: str,
    reset_url: str,
    mobile_reset_url: str | None = None,
) -> None:
    subject = "Orbly — Şifre sıfırlama"
    mobile_block = ""
    mobile_html = ""
    if mobile_reset_url:
        mobile_block = f"\nMobil uygulama: {mobile_reset_url}\n"
        mobile_html = f"""
  <p style="font-size:14px;color:#555">Mobil uygulamada açmak için:
    <a href="{mobile_reset_url}">Uygulamada sıfırla</a>
  </p>"""
    text = (
        "Orbly hesabın için şifre sıfırlama talebi aldık.\n\n"
        f"Web: {reset_url}\n"
        f"{mobile_block}\n"
        "Bağlantılar 1 saat geçerlidir. Talebi sen yapmadıysan bu e-postayı yok say.\n"
    )
    html = f"""<!DOCTYPE html>
<html lang="tr">
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
  <p>Orbly hesabın için şifre sıfırlama talebi aldık.</p>
  <p><a href="{reset_url}" style="display:inline-block;padding:12px 20px;background:#6366f1;color:#fff;text-decoration:none;border-radius:999px;font-weight:700">Şifremi sıfırla (web)</a></p>
  {mobile_html}
  <p style="font-size:14px;color:#555">Bağlantılar 1 saat geçerlidir. Talebi sen yapmadıysan bu e-postayı yok say.</p>
</body>
</html>"""

    if not _smtp_configured():
        if settings.node_env == "development":
            logger.warning("SMTP yapılandırılmadı — şifre sıfırlama bağlantısı: %s", reset_url)
            return
        raise RuntimeError("E-posta servisi yapılandırılmamış")

    await asyncio.to_thread(
        _send_sync,
        to=to,
        subject=subject,
        html=html,
        text=text,
    )
