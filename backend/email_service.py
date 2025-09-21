# backend/email_service.py
import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import Dict, Any, Optional, List
import ssl
import socket
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Email configuration with validation
SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
EMAIL_USER = os.environ.get('EMAIL_USER')
EMAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD')

# Validate email configuration on startup
if not EMAIL_USER or not EMAIL_PASSWORD:
    logger.warning("Email credentials not configured. Set EMAIL_USER and EMAIL_PASSWORD environment variables.")

class EmailService:
    def __init__(self):
        self.smtp_server = SMTP_SERVER
        self.smtp_port = SMTP_PORT
        self.email_user = EMAIL_USER
        self.email_password = EMAIL_PASSWORD
    
    def validate_config(self) -> bool:
        """Validate email configuration"""
        return bool(self.email_user and self.email_password)
    
    def create_message(self, to_email: str, subject: str, message: str, 
                      html_message: Optional[str] = None) -> MIMEMultipart:
        """Create email message with proper headers"""
        msg = MIMEMultipart('alternative')
        msg['From'] = self.email_user
        msg['To'] = to_email
        msg['Subject'] = subject
        msg['Date'] = datetime.now().strftime('%a, %d %b %Y %H:%M:%S %z')
        
        # Add plain text part
        text_part = MIMEText(message, 'plain', 'utf-8')
        msg.attach(text_part)
        
        # Add HTML part if provided
        if html_message:
            html_part = MIMEText(html_message, 'html', 'utf-8')
            msg.attach(html_part)
        
        return msg
    
    def send_email(self, to_email: str, subject: str, message: str, 
                   html_message: Optional[str] = None) -> Dict[str, Any]:
        """Send email with proper error handling and logging"""
        try:
            if not self.validate_config():
                return {
                    'success': False,
                    'error': 'Email configuration not set. Please configure EMAIL_USER and EMAIL_PASSWORD.'
                }
            
            # Create message
            msg = self.create_message(to_email, subject, message, html_message)
            
            # Create secure connection
            context = ssl.create_default_context()
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=30) as server:
                # Enable debug output for development
                if app.debug:
                    server.set_debuglevel(1)
                
                # Start TLS encryption
                server.starttls(context=context)
                
                # Login to server
                server.login(self.email_user, self.email_password)
                
                # Send message
                server.send_message(msg)
                
                logger.info(f"Email sent successfully to {to_email}")
                return {'success': True, 'message': 'Email sent successfully'}
                
        except smtplib.SMTPAuthenticationError as e:
            error_msg = f"SMTP Authentication failed: {str(e)}"
            logger.error(error_msg)
            return {'success': False, 'error': error_msg}
            
        except smtplib.SMTPRecipientsRefused as e:
            error_msg = f"Recipients refused: {str(e)}"
            logger.error(error_msg)
            return {'success': False, 'error': error_msg}
            
        except smtplib.SMTPServerDisconnected as e:
            error_msg = f"SMTP server disconnected: {str(e)}"
            logger.error(error_msg)
            return {'success': False, 'error': error_msg}
            
        except smtplib.SMTPException as e:
            error_msg = f"SMTP error: {str(e)}"
            logger.error(error_msg)
            return {'success': False, 'error': error_msg}
            
        except socket.timeout:
            error_msg = "Email send timeout - please try again"
            logger.error(error_msg)
            return {'success': False, 'error': error_msg}
            
        except Exception as e:
            error_msg = f"Unexpected error sending email: {str(e)}"
            logger.error(error_msg)
            return {'success': False, 'error': error_msg}

# Initialize email service
email_service = EmailService()

def create_html_template(content: str, title: str = "Assessment Notification") -> str:
    """Create HTML email template"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>{title}</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{
                background: #f8f9fa;
                padding: 30px;
                border: 1px solid #e9ecef;
            }}
            .footer {{
                background: #6c757d;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 0 0 10px 10px;
                font-size: 14px;
            }}
            .btn {{
                display: inline-block;
                padding: 12px 24px;
                background: #007bff;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 10px 0;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>{title}</h1>
        </div>
        <div class="content">
            {content}
        </div>
        <div class="footer">
            <p>Assessment Platform &copy; 2024</p>
        </div>
    </body>
    </html>
    """

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        config_valid = email_service.validate_config()
        return jsonify({
            'status': 'healthy',
            'email_configured': config_valid,
            'smtp_server': SMTP_SERVER,
            'smtp_port': SMTP_PORT,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/send-assessment-email', methods=['POST'])
def send_assessment_email():
    """Send assessment invitation or completion email"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        assessment = data.get('assessment', {})
        candidate_email = data.get('candidateEmail')
        email_type = data.get('type', 'assigned')
        
        if not candidate_email:
            return jsonify({'success': False, 'error': 'Candidate email is required'}), 400
        
        if not assessment:
            return jsonify({'success': False, 'error': 'Assessment data is required'}), 400
        
        # Create email content based on type
        if email_type == 'assigned':
            subject = f"Assessment Invitation: {assessment.get('title', 'New Assessment')}"
            
            plain_message = f"""Dear Candidate,

You have been invited to take the assessment: {assessment.get('title', 'New Assessment')}

Assessment Details:
• Description: {assessment.get('description', 'No description provided')}
• Time Limit: {assessment.get('timeLimit', 30)} minutes
• Job Role: {assessment.get('jobRole', 'Not specified')}
• Difficulty: {assessment.get('difficulty', 'Medium')}

Please log in to your account to complete the assessment at your earliest convenience.

Important Notes:
- Make sure you have a stable internet connection
- Complete the assessment in one session
- Contact support if you experience any technical issues

Best regards,
Assessment Team
"""
            
            html_content = f"""
            <h2>Assessment Invitation</h2>
            <p>You have been invited to take the following assessment:</p>
            <h3>{assessment.get('title', 'New Assessment')}</h3>
            <div style="background: #e9ecef; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Description:</strong> {assessment.get('description', 'No description provided')}</p>
                <p><strong>Time Limit:</strong> {assessment.get('timeLimit', 30)} minutes</p>
                <p><strong>Job Role:</strong> {assessment.get('jobRole', 'Not specified')}</p>
                <p><strong>Difficulty:</strong> {assessment.get('difficulty', 'Medium')}</p>
            </div>
            <p>Please log in to your account to complete the assessment.</p>
            <p><strong>Important:</strong> Ensure you have a stable internet connection and complete the assessment in one session.</p>
            """
            
        else:  # completed
            subject = f"Assessment Completed: {assessment.get('title', 'Assessment')}"
            
            plain_message = f"""Dear Candidate,

Thank you for completing the assessment: {assessment.get('title', 'Assessment')}

Your submission has been received and will be reviewed by our team. You will be notified once the evaluation is complete.

Assessment Summary:
• Completed on: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}
• Duration: {data.get('duration', 'Not specified')}

Next Steps:
Our team will review your responses and provide feedback within 3-5 business days.

Thank you for your participation.

Best regards,
Assessment Team
"""
            
            html_content = f"""
            <h2>Assessment Completed Successfully</h2>
            <p>Thank you for completing: <strong>{assessment.get('title', 'Assessment')}</strong></p>
            <div style="background: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                <p><strong>Completed on:</strong> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
                <p><strong>Duration:</strong> {data.get('duration', 'Not specified')}</p>
            </div>
            <p>Your submission has been received and will be reviewed by our team.</p>
            <p><strong>Next Steps:</strong> You will receive feedback within 3-5 business days.</p>
            """
        
        html_message = create_html_template(html_content, "Assessment Notification")
        
        # Send email
        result = email_service.send_email(
            candidate_email, 
            subject, 
            plain_message, 
            html_message
        )
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in send_assessment_email: {str(e)}")
        return jsonify({'success': False, 'error': f'Server error: {str(e)}'}), 500

@app.route('/send-result-email', methods=['POST'])
def send_result_email():
    """Send assessment results to candidate"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        assessment = data.get('assessment', {})
        submission = data.get('submission', {})
        candidate = data.get('candidate', {})
        
        if not candidate.get('email'):
            return jsonify({'success': False, 'error': 'Candidate email is required'}), 400
        
        candidate_name = candidate.get('name', 'Candidate')
        assessment_title = assessment.get('title', 'Assessment')
        score = submission.get('score', 0)
        time_spent = submission.get('timeSpent', 'N/A')
        passed = submission.get('passed', False)
        
        subject = f"Assessment Results: {assessment_title}"
        
        if passed:
            plain_message = f"""Dear {candidate_name},

Congratulations! You have successfully passed the assessment: {assessment_title}

Your Results:
• Score: {score}%
• Time Spent: {time_spent} minutes
• Status: PASSED ✓

We are impressed with your performance and will be in touch regarding the next steps in the process.

Keep up the excellent work!

Best regards,
Assessment Team
"""
            
            html_content = f"""
            <h2>Congratulations! 🎉</h2>
            <p>Dear {candidate_name},</p>
            <p>You have successfully <strong style="color: #28a745;">PASSED</strong> the assessment: <strong>{assessment_title}</strong></p>
            <div style="background: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                <p><strong>Score:</strong> {score}%</p>
                <p><strong>Time Spent:</strong> {time_spent} minutes</p>
                <p><strong>Status:</strong> <span style="color: #28a745;">PASSED ✓</span></p>
            </div>
            <p>We are impressed with your performance and will be in touch regarding the next steps.</p>
            """
            
        else:
            plain_message = f"""Dear {candidate_name},

Thank you for completing the assessment: {assessment_title}

Your Results:
• Score: {score}%
• Time Spent: {time_spent} minutes
• Status: Not Passed

While you didn't meet the passing criteria this time, we appreciate your effort and encourage you to continue developing your skills.

We wish you the best in your future endeavors.

Best regards,
Assessment Team
"""
            
            html_content = f"""
            <h2>Assessment Results</h2>
            <p>Dear {candidate_name},</p>
            <p>Thank you for completing the assessment: <strong>{assessment_title}</strong></p>
            <div style="background: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
                <p><strong>Score:</strong> {score}%</p>
                <p><strong>Time Spent:</strong> {time_spent} minutes</p>
                <p><strong>Status:</strong> <span style="color: #dc3545;">Not Passed</span></p>
            </div>
            <p>While you didn't meet the passing criteria this time, we encourage you to continue developing your skills.</p>
            """
        
        html_message = create_html_template(html_content, "Assessment Results")
        
        # Send email
        result = email_service.send_email(
            candidate.get('email'), 
            subject, 
            plain_message, 
            html_message
        )
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in send_result_email: {str(e)}")
        return jsonify({'success': False, 'error': f'Server error: {str(e)}'}), 500

@app.route('/analyze-candidate', methods=['POST'])
def analyze_candidate():
    """Analyze candidate performance and provide insights"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        assessment = data.get('assessment', {})
        submission = data.get('submission', {})
        candidate = data.get('candidate', {})
        job_description = data.get('jobDescription', '')
        
        # Calculate skills match based on assessment score and job description
        base_score = submission.get('score', 0)
        time_efficiency = min(100, (assessment.get('timeLimit', 30) / max(submission.get('timeSpent', 30), 1)) * 100)
        
        # Mock AI analysis - replace with actual AI model integration
        skills_match = min(100, (base_score + time_efficiency) / 2)
        
        # Generate recommendations based on score
        if base_score >= 80:
            recommendation = "Highly recommended for the next interview round. Excellent technical skills and strong alignment with job requirements."
            strengths = [
                "Excellent problem-solving abilities",
                "Strong technical knowledge",
                "Good time management skills",
                "High accuracy in responses"
            ]
            areas_for_improvement = [
                "Continue expanding knowledge in emerging technologies",
                "Practice advanced problem-solving scenarios"
            ]
        elif base_score >= 60:
            recommendation = "Recommended for next interview round with some reservations. Good technical foundation with room for improvement."
            strengths = [
                "Good technical foundation",
                "Decent problem-solving skills",
                "Shows potential for growth"
            ]
            areas_for_improvement = [
                "Strengthen core technical concepts",
                "Improve time management",
                "Practice more complex problem scenarios"
            ]
        else:
            recommendation = "Not recommended for current role. Consider for junior positions or suggest additional training."
            strengths = [
                "Shows willingness to learn",
                "Basic understanding of concepts"
            ]
            areas_for_improvement = [
                "Significant improvement needed in technical skills",
                "Focus on fundamental concepts",
                "Consider additional training or certification"
            ]
        
        analysis = {
            'skillsMatch': round(skills_match, 1),
            'overallScore': base_score,
            'timeEfficiency': round(time_efficiency, 1),
            'overallAssessment': f"Candidate scored {base_score}% with {round(time_efficiency, 1)}% time efficiency",
            'strengths': strengths,
            'areasForImprovement': areas_for_improvement,
            'recommendation': recommendation,
            'analysisDate': datetime.now().isoformat(),
            'assessmentDetails': {
                'title': assessment.get('title', 'N/A'),
                'difficulty': assessment.get('difficulty', 'N/A'),
                'jobRole': assessment.get('jobRole', 'N/A')
            }
        }
        
        return jsonify(analysis)
        
    except Exception as e:
        logger.error(f"Error in analyze_candidate: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Check configuration on startup
    if not email_service.validate_config():
        logger.warning("Starting without email configuration. Set EMAIL_USER and EMAIL_PASSWORD environment variables.")
    else:
        logger.info("Email service configured successfully")
    
    app.run(debug=True, port=5002, host='0.0.0.0')