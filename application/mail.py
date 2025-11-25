import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

SMTP_SERVER_HOST = "localhost"
SMTP_SERVER_PORT = 1025
SENDER_ADDRESS = "healixcare@donotreply.in"
SENDER_PASSWORD = ""  # Not required for MailHog

def send_email(to_address, subject, message, content="html", attachment_path=None):
    msg = MIMEMultipart()
    msg['From'] = SENDER_ADDRESS
    msg['To'] = to_address
    msg['Subject'] = subject

    if content == "html":
        msg.attach(MIMEText(message, "html"))
    else:
        msg.attach(MIMEText(message, "plain"))

    # Attach file if provided
    if attachment_path:
        with open(attachment_path, "rb") as f:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(f.read())
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', f'attachment; filename={attachment_path.split("/")[-1]}')
        msg.attach(part)

    # MailHog does not require login
    s = smtplib.SMTP(SMTP_SERVER_HOST, SMTP_SERVER_PORT)
    s.send_message(msg)
    s.quit()
    return True
