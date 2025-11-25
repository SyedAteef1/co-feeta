"""
Demo Booking API
Handles demo booking requests
"""
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
demo_bp = Blueprint('demo', __name__)

@demo_bp.route('/book', methods=['POST'])
@cross_origin()
def book_demo():
    """Store demo booking request"""
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        company = data.get('company', '')
        team_size = data.get('teamSize')
        
        if not name or not email or not team_size:
            return jsonify({'error': 'Name, email, and team size are required'}), 400
        
        from app.database.mongodb import db
        demo_bookings = db['demo_bookings']
        
        booking = {
            'name': name,
            'email': email,
            'company': company,
            'team_size': team_size,
            'created_at': datetime.utcnow(),
            'status': 'pending'
        }
        
        result = demo_bookings.insert_one(booking)
        logger.info(f"Demo booking created: {email}")
        
        # Send email notification
        try:
            from app import mail
            from flask_mail import Message
            from flask import current_app
            
            subject = "Feeta Demo Request Confirmation"
            
            # Professional HTML Template
            html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Feeta Demo Request</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }}
        .header {{
            background-color: #1a1a1a;
            padding: 30px;
            text-align: center;
        }}
        .logo {{
            color: #ffffff;
            font-size: 24px;
            font-weight: bold;
            text-decoration: none;
            letter-spacing: 1px;
        }}
        .logo span {{
            color: #3b82f6;
        }}
        .content {{
            padding: 40px 30px;
        }}
        .greeting {{
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #111;
        }}
        .message-text {{
            margin-bottom: 20px;
            color: #4b5563;
        }}
        .highlight-box {{
            background-color: #f3f4f6;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .slots-container {{
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }}
        .slot-day {{
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 5px;
            display: block;
        }}
        .slot-times {{
            color: #6b7280;
            margin-bottom: 15px;
            display: block;
        }}
        .cta-button {{
            display: inline-block;
            background-color: #3b82f6;
            color: #ffffff !important;
            padding: 14px 28px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
            box-shadow: 0 2px 5px rgba(59, 130, 246, 0.3);
        }}
        .cta-button:hover {{
            background-color: #2563eb;
        }}
        .features-list {{
            list-style: none;
            padding: 0;
            margin: 20px 0;
        }}
        .features-list li {{
            padding-left: 25px;
            position: relative;
            margin-bottom: 10px;
            color: #4b5563;
        }}
        .features-list li:before {{
            content: "✓";
            position: absolute;
            left: 0;
            color: #3b82f6;
            font-weight: bold;
        }}
        .footer {{
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
        }}
        .signature {{
            margin-top: 30px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }}
        .signature-name {{
            font-weight: 700;
            color: #111;
            display: block;
        }}
        .signature-title {{
            color: #6b7280;
            font-size: 14px;
            display: block;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="https://feeta-ai.com" class="logo">Feeta<span>.ai</span></a>
        </div>
        
        <div class="content">
            <div class="greeting">Hi {name.split()[0]},</div>
            
            <p class="message-text">I hope you’ve been well.</p>
            
            <p class="message-text">I just noticed your demo request for Feeta (my apologies for the delay — we’ve had a sudden spike of demo bookings over the last week, so some submissions were buried). Thanks for your patience — and honestly, I’m excited to finally connect with you.</p>
            
            <div class="highlight-box">
                Since you lead a team of <strong>{team_size}</strong> at <strong>{company or 'your company'}</strong>, I want to make sure the demo is tailored to your execution workflow.
            </div>
            
            <p class="message-text">Before we hop on, could you let me know if you’re free for a quick session this week?</p>
            
            <div class="slots-container">
                <span class="slot-day">Tuesday</span>
                <span class="slot-times">1:00 PM / 3:00 PM / 5:00 PM CET</span>
                
                <span class="slot-day">Wednesday</span>
                <span class="slot-times">12:00 PM / 4:00 PM CET</span>
                
                <span class="slot-day">Thursday</span>
                <span class="slot-times">2:00 PM CET</span>
            </div>
            
            <div style="text-align: center;">
                <a href="https://calendly.com/vsyedateefquadri/30min" class="cta-button">Book Your Preferred Slot</a>
            </div>
            
            <p class="message-text">To make the session more useful, I’d love to understand what you want Feeta to solve for your team:</p>
            
            <ul class="features-list">
                <li>Turning vague tasks into clear execution steps</li>
                <li>Reducing standups / status checks</li>
                <li>Auto-assignment to the right team member</li>
                <li>Handling clarifications & follow-ups</li>
                <li>Real-time visibility of team progress</li>
            </ul>
            
            <p class="message-text">Just reply with your preferred time and focus areas — I’ll take care of the rest.</p>
            
            <div class="signature">
                <p class="message-text">Looking forward to meeting you, {name.split()[0]}.</p>
                <span class="signature-name">Syed</span>
                <span class="signature-title">Founder, Feeta AI</span>
                <a href="mailto:syed@feeta-ai.com" style="color: #3b82f6; text-decoration: none; font-size: 14px;">syed@feeta-ai.com</a>
            </div>
        </div>
        
        <div class="footer">
            &copy; {datetime.now().year} Feeta AI. All rights reserved.<br>
            Transforming how teams execute.
        </div>
    </div>
</body>
</html>
"""
            
            msg = Message(
                subject=subject,
                recipients=[email],
                html=html_body,  # Use html instead of body
                sender=current_app.config['MAIL_USERNAME']
            )
            
            # Also send a copy to the founder
            msg_admin = Message(
                subject=f"New Demo Request: {name} ({company})",
                recipients=[current_app.config['MAIL_USERNAME']],
                body=f"New demo request details:\n\nName: {name}\nEmail: {email}\nCompany: {company}\nTeam Size: {team_size}\n\nThey have received the automated welcome email.",
                sender=current_app.config['MAIL_USERNAME']
            )
            
            mail.send(msg)
            mail.send(msg_admin)
            logger.info(f"✅ Demo email sent to {email}")
            
        except Exception as email_error:
            logger.error(f"❌ Failed to send email: {str(email_error)}")
            # Don't fail the request if email fails, just log it
        
        return jsonify({
            'success': True,
            'message': 'Demo booking received successfully',
            'booking_id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating demo booking: {str(e)}")
        return jsonify({'error': 'Failed to book demo'}), 500
