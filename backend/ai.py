# # backend/ai.py
# import os
# import json
# import requests
# import smtplib
# from email.mime.text import MIMEText
# from email.mime.multipart import MIMEMultipart
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from groq import Groq
# from dotenv import load_dotenv


# # Load environment variables
# load_dotenv()

# app = Flask(__name__)
# CORS(app, origins=["http://localhost:5173"])  # Allow requests from your Vite dev server

# # Initialize Groq client
# groq_api_key = os.environ.get("GROQ_API_KEY")
# if not groq_api_key:
#     raise ValueError("GROQ_API_KEY environment variable is not set")

# client = Groq(api_key=groq_api_key)

# # Email configuration
# SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
# SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
# EMAIL_USER = os.environ.get('EMAIL_USER')
# EMAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD')

# def send_email(to_email, subject, message):
#     try:
#         msg = MIMEMultipart()
#         msg['From'] = EMAIL_USER
#         msg['To'] = to_email
#         msg['Subject'] = subject

#         msg.attach(MIMEText(message, 'plain'))

#         server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
#         server.starttls()
#         server.login(EMAIL_USER, EMAIL_PASSWORD)
#         server.send_message(msg)
#         server.quit()
        
#         return True
#     except Exception as e:
#         print(f"Error sending email: {e}")
#         return False

# @app.route('/generate-assessment', methods=['POST'])
# def generate_assessment():
#     try:
#         data = request.json
#         job_role = data.get('jobRole', 'Software Developer')
#         assessment_type = data.get('type', 'multiple_choice')
#         difficulty = data.get('difficulty', 'intermediate')
#         num_questions = data.get('numberOfQuestions', 5)
        
#         prompt = f"""
#         Create a {assessment_type} assessment for a {job_role} position with {difficulty} difficulty level.
#         Generate {num_questions} questions.
        
#         The assessment should include:
#         - Clear instructions
#         - Relevant questions for the role
#         - Appropriate difficulty level
#         - Answer key or evaluation criteria
        
#         Return the response as a JSON object with this structure:
#         {{
#             "title": "Assessment title",
#             "description": "Assessment description",
#             "jobRole": "{job_role}",
#             "type": "{assessment_type}",
#             "difficulty": "{difficulty}",
#             "questions": [
#                 {{
#                     "id": "q1",
#                     "question": "Question text",
#                     "type": "multiple_choice",
#                     "options": ["Option1", "Option2", "Option3", "Option4"],
#                     "correctAnswer": "0",
#                     "codeTemplate": "",
#                     "testCases": []
#                 }}
#             ],
#             "timeLimit": 30,
#             "passingScore": 70
#         }}
#         """
        
#         # Call Groq API
#         chat_completion = client.chat.completions.create(
#             messages=[{"role": "user", "content": prompt}],
#             model="llama-3.3-70b-versatile",
#             temperature=0.7,
#             max_tokens=4000
#         )
        
#         content = chat_completion.choices[0].message.content
#         print("GROQ API Response:", content)  # Debug output
        
#         # Extract JSON from the response
#         json_start = content.find('{')
#         json_end = content.rfind('}') + 1
        
#         if json_start == -1 or json_end == 0:
#             return jsonify({"error": "Failed to generate valid assessment format"}), 500
            
#         json_str = content[json_start:json_end]
        
#         try:
#             assessment_data = json.loads(json_str)
#         except json.JSONDecodeError as e:
#             return jsonify({"error": f"Failed to parse AI response: {str(e)}"}), 500
        
#         return jsonify(assessment_data)
        
#     except Exception as e:
#         print(f"Error in generate_assessment: {str(e)}")  # Debug output
#         return jsonify({"error": str(e)}), 500

# @app.route('/evaluate-submission', methods=['POST'])
# def evaluate_submission():
#     try:
#         data = request.json
#         questions = data.get('questions', [])
#         answers = data.get('answers', {})
        
#         results = []
#         score = 0
        
#         for question in questions:
#             question_id = question['id']
#             user_answer = answers.get(question_id, '')
#             correct_answer = question.get('correctAnswer', '')
            
#             if user_answer == correct_answer:
#                 score += 1
#                 results.append({
#                     'questionId': question_id,
#                     'correct': True,
#                     'feedback': 'Correct answer'
#                 })
#             else:
#                 results.append({
#                     'questionId': question_id,
#                     'correct': False,
#                     'feedback': f'Expected: {correct_answer}, Got: {user_answer}'
#                 })
        
#         total_questions = len(questions)
#         percentage = (score / total_questions) * 100 if total_questions > 0 else 0
        
#         return jsonify({
#             'score': score,
#             'totalQuestions': total_questions,
#             'percentage': percentage,
#             'passed': percentage >= data.get('passingScore', 70),
#             'results': results
#         })
        
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @app.route('/generate-violation-report', methods=['POST'])
# def generate_violation_report():
#     try:
#         data = request.json
#         assignment_id = data.get('assignmentId')
#         violations = data.get('violations', [])
        
#         prompt = f"""
#         Analyze these proctoring violations for an assessment and generate a comprehensive report:
        
#         Assignment ID: {assignment_id}
#         Total Violations: {len(violations)}
        
#         Violations:
#         {json.dumps(violations, indent=2)}
        
#         Provide a JSON response with this structure:
#         {{
#             "summary": "Brief summary of the findings",
#             "severityBreakdown": {{
#                 "low": 0,
#                 "medium": 0,
#                 "high": 0
#             }},
#             "recommendations": [
#                 "Recommendation 1",
#                 "Recommendation 2"
#             ],
#             "confidence": "high|medium|low"
#         }}
        
#         Analyze patterns, frequency, and severity of violations to provide meaningful insights.
#         """
        
#         # Call Groq API
#         chat_completion = client.chat.completions.create(
#             messages=[{"role": "user", "content": prompt}],
#             model="llama-3.3-70b-versatile", 
#             temperature=0.3,  # Lower temperature for more factual responses
#             max_tokens=1000
#         )
        
#         content = chat_completion.choices[0].message.content
        
#         # Extract JSON from the response
#         json_start = content.find('{')
#         json_end = content.rfind('}') + 1
        
#         if json_start == -1 or json_end == 0:
#             return jsonify({"error": "Failed to generate valid report format"}), 500
            
#         json_str = content[json_start:json_end]
        
#         try:
#             report_data = json.loads(json_str)
#         except json.JSONDecodeError as e:
#             return jsonify({"error": f"Failed to parse AI response: {str(e)}"}), 500
        
#         return jsonify(report_data)
        
#     except Exception as e:
#         print(f"Error in generate_violation_report: {str(e)}")
#         return jsonify({"error": str(e)}), 500

# @app.route('/analyze-candidate', methods=['POST'])
# def analyze_candidate():
#     try:
#         data = request.json
#         assessment = data.get('assessment')
#         submission = data.get('submission')
#         candidate = data.get('candidate')
#         job_description = data.get('jobDescription', '')
        
#         prompt = f"""
#         Analyze this candidate's assessment performance and provide a comprehensive evaluation:
        
#         Candidate: {candidate.get('name', 'Unknown')} ({candidate.get('email', 'No email')})
#         Assessment: {assessment.get('title', 'Unknown')} - {assessment.get('jobRole', 'No role')}
#         Score: {submission.get('score', 0)}% (Passing: {assessment.get('passingScore', 70)}%)
#         Time Spent: {submission.get('timeSpent', 'N/A')} minutes
#         Violations: {submission.get('violations', 0)}
        
#         Job Description: {job_description}
        
#         Provide a JSON response with this structure:
#         {{
#             "skillsMatch": 85,
#             "overallScore": {submission.get('score', 0)},
#             "overallAssessment": "Overall assessment summary",
#             "strengths": ["Strength 1", "Strength 2"],
#             "areasForImprovement": ["Area 1", "Area 2"],
#             "recommendation": "Final recommendation for hiring"
#         }}
        
#         Analyze the candidate's performance, skills match with the job requirements, and provide
#         actionable insights for the hiring team.
#         """
        
#         # Call Groq API
#         chat_completion = client.chat.completions.create(
#             messages=[{"role": "user", "content": prompt}],
#             model="llama-3.3-70b-versatile",
#             temperature=0.3,
#             max_tokens=1500
#         )
        
#         content = chat_completion.choices[0].message.content
        
#         # Extract JSON from the response
#         json_start = content.find('{')
#         json_end = content.rfind('}') + 1
        
#         if json_start == -1 or json_end == 0:
#             return jsonify({"error": "Failed to generate valid analysis format"}), 500
            
#         json_str = content[json_start:json_end]
        
#         try:
#             analysis_data = json.loads(json_str)
#         except json.JSONDecodeError as e:
#             return jsonify({"error": f"Failed to parse AI response: {str(e)}"}), 500
        
#         return jsonify(analysis_data)
        
#     except Exception as e:
#         print(f"Error in analyze_candidate: {str(e)}")
#         return jsonify({"error": str(e)}), 500

# @app.route('/send-assessment-email', methods=['POST'])
# def send_assessment_email():
#     try:
#         data = request.json
#         assessment = data.get('assessment')
#         candidate_email = data.get('candidateEmail')
#         email_type = data.get('type', 'assigned')
        
#         if email_type == 'assigned':
#             subject = f"Assessment Invitation: {assessment.get('title', '')}"
#             message = f"""Dear Candidate,

# You have been invited to take the assessment: {assessment.get('title', '')}

# Description: {assessment.get('description', '')}
# Time Limit: {assessment.get('timeLimit', 30)} minutes
# Job Role: {assessment.get('jobRole', '')}

# Please log in to your account to complete the assessment.

# Best regards,
# Assessment Team
# """
#         else: # completed
#             subject = f"Assessment Completed: {assessment.get('title', '')}"
#             message = f"""Dear Candidate,

# You have successfully completed the assessment: {assessment.get('title', '')}

# Your results will be reviewed by our team. You will be notified once the evaluation is complete.

# Thank you for your participation.

# Best regards,
# Assessment Team
# """
        
#         success = send_email(candidate_email, subject, message)
#         return jsonify({'success': success})
        
#     except Exception as e:
#         print(f"Error in send_assessment_email: {str(e)}")
#         return jsonify({'error': str(e)}), 500

# @app.route('/send-result-email', methods=['POST'])
# def send_result_email():
#     try:
#         data = request.json
#         assessment = data.get('assessment')
#         submission = data.get('submission')
#         candidate = data.get('candidate')
        
#         subject = f"Assessment Results: {assessment.get('title', '')}"
        
#         if submission.get('passed'):
#             message = f"""Dear {candidate.get('name', 'Candidate')},

# Congratulations! You have passed the assessment: {assessment.get('title', '')}

# Your score: {submission.get('score', 0)}%
# Time spent: {submission.get('timeSpent', 'N/A')} minutes

# We will be in touch regarding the next steps in the process.

# Best regards,
# Assessment Team
# """
#         else:
#             message = f"""Dear {candidate.get('name', 'Candidate')},

# Thank you for completing the assessment: {assessment.get('title', '')}

# Your score: {submission.get('score', 0)}%
# Time spent: {submission.get('timeSpent', 'N/A')} minutes

# While you didn't meet the passing criteria this time, we encourage you to continue developing your skills.

# Best regards,
# Assessment Team
# """
        
#         success = send_email(candidate.get('email'), subject, message)
#         return jsonify({'success': success})
        
#     except Exception as e:
#         print(f"Error in send_result_email: {str(e)}")
#         return jsonify({'error': str(e)}), 500

# @app.route('/health', methods=['GET'])
# def health_check():
#     return jsonify({
#         "status": "ok", 
#         "message": "Backend is running",
#         "services": {
#             "ai_generation": "active",
#             "email_service": "active" if EMAIL_USER and EMAIL_PASSWORD else "inactive",
#             "violation_reporting": "active",
#             "candidate_analysis": "active"
#         }
#     })

# if __name__ == '__main__':
#     # Check if email service is configured
#     if not EMAIL_USER or not EMAIL_PASSWORD:
#         print("Warning: Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD environment variables.")
    
#     app.run(debug=True, port=5001, host='0.0.0.0')



# backend/ai.py
import os
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "https://skills-v2-frontend.onrender.com"])  # Add your Render frontend URL

# Initialize Groq client
groq_api_key = os.environ.get("GROQ_API_KEY")
if not groq_api_key:
    raise ValueError("GROQ_API_KEY environment variable is not set")

client = Groq(api_key=groq_api_key)

# Email configuration
SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
EMAIL_USER = os.environ.get('EMAIL_USER')
EMAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD')

def send_email(to_email, subject, message):
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_USER
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(message, 'plain'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

@app.route('/generate-assessment', methods=['POST'])
def generate_assessment():
    try:
        data = request.json
        job_role = data.get('jobRole', 'Software Developer')
        assessment_type = data.get('type', 'multiple_choice')
        difficulty = data.get('difficulty', 'intermediate')
        num_questions = data.get('numberOfQuestions', 5)
        
        prompt = f"""
        Create a {assessment_type} assessment for a {job_role} position with {difficulty} difficulty level.
        Generate {num_questions} questions.
        
        The assessment should include:
        - Clear instructions
        - Relevant questions for the role
        - Appropriate difficulty level
        - Answer key or evaluation criteria
        
        Return the response as a JSON object with this structure:
        {{
            "title": "Assessment title",
            "description": "Assessment description",
            "jobRole": "{job_role}",
            "type": "{assessment_type}",
            "difficulty": "{difficulty}",
            "questions": [
                {{
                    "id": "q1",
                    "question": "Question text",
                    "type": "multiple_choice",
                    "options": ["Option1", "Option2", "Option3", "Option4"],
                    "correctAnswer": "0",
                    "codeTemplate": "",
                    "testCases": []
                }}
            ],
            "timeLimit": 30,
            "passingScore": 70
        }}
        """
        
        # Call Groq API
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=4000
        )
        
        content = chat_completion.choices[0].message.content
        print("GROQ API Response:", content)  # Debug output
        
        # Extract JSON from the response
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        
        if json_start == -1 or json_end == 0:
            return jsonify({"error": "Failed to generate valid assessment format"}), 500
            
        json_str = content[json_start:json_end]
        
        try:
            assessment_data = json.loads(json_str)
        except json.JSONDecodeError as e:
            return jsonify({"error": f"Failed to parse AI response: {str(e)}"}), 500
        
        return jsonify(assessment_data)
        
    except Exception as e:
        print(f"Error in generate_assessment: {str(e)}")  # Debug output
        return jsonify({"error": str(e)}), 500

@app.route('/evaluate-submission', methods=['POST'])
def evaluate_submission():
    try:
        data = request.json
        questions = data.get('questions', [])
        answers = data.get('answers', {})
        
        results = []
        score = 0
        
        for question in questions:
            question_id = question['id']
            user_answer = answers.get(question_id, '')
            correct_answer = question.get('correctAnswer', '')
            
            if user_answer == correct_answer:
                score += 1
                results.append({
                    'questionId': question_id,
                    'correct': True,
                    'feedback': 'Correct answer'
                })
            else:
                results.append({
                    'questionId': question_id,
                    'correct': False,
                    'feedback': f'Expected: {correct_answer}, Got: {user_answer}'
                })
        
        total_questions = len(questions)
        percentage = (score / total_questions) * 100 if total_questions > 0 else 0
        
        return jsonify({
            'score': score,
            'totalQuestions': total_questions,
            'percentage': percentage,
            'passed': percentage >= data.get('passingScore', 70),
            'results': results
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/generate-violation-report', methods=['POST'])
def generate_violation_report():
    try:
        data = request.json
        assignment_id = data.get('assignmentId')
        violations = data.get('violations', [])
        
        prompt = f"""
        Analyze these proctoring violations for an assessment and generate a comprehensive report:
        
        Assignment ID: {assignment_id}
        Total Violations: {len(violations)}
        
        Violations:
        {json.dumps(violations, indent=2)}
        
        Provide a JSON response with this structure:
        {{
            "summary": "Brief summary of the findings",
            "severityBreakdown": {{
                "low": 0,
                "medium": 0,
                "high": 0
            }},
            "recommendations": [
                "Recommendation 1",
                "Recommendation 2"
            ],
            "confidence": "high|medium|low"
        }}
        
        Analyze patterns, frequency, and severity of violations to provide meaningful insights.
        """
        
        # Call Groq API
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile", 
            temperature=0.3,  # Lower temperature for more factual responses
            max_tokens=1000
        )
        
        content = chat_completion.choices[0].message.content
        
        # Extract JSON from the response
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        
        if json_start == -1 or json_end == 0:
            return jsonify({"error": "Failed to generate valid report format"}), 500
            
        json_str = content[json_start:json_end]
        
        try:
            report_data = json.loads(json_str)
        except json.JSONDecodeError as e:
            return jsonify({"error": f"Failed to parse AI response: {str(e)}"}), 500
        
        return jsonify(report_data)
        
    except Exception as e:
        print(f"Error in generate_violation_report: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/analyze-candidate', methods=['POST'])
def analyze_candidate():
    try:
        data = request.json
        assessment = data.get('assessment')
        submission = data.get('submission')
        candidate = data.get('candidate')
        job_description = data.get('jobDescription', '')
        
        prompt = f"""
        Analyze this candidate's assessment performance and provide a comprehensive evaluation:
        
        Candidate: {candidate.get('name', 'Unknown')} ({candidate.get('email', 'No email')})
        Assessment: {assessment.get('title', 'Unknown')} - {assessment.get('jobRole', 'No role')}
        Score: {submission.get('score', 0)}% (Passing: {assessment.get('passingScore', 70)}%)
        Time Spent: {submission.get('timeSpent', 'N/A')} minutes
        Violations: {submission.get('violations', 0)}
        
        Job Description: {job_description}
        
        Provide a JSON response with this structure:
        {{
            "skillsMatch": 85,
            "overallScore": {submission.get('score', 0)},
            "overallAssessment": "Overall assessment summary",
            "strengths": ["Strength 1", "Strength 2"],
            "areasForImprovement": ["Area 1", "Area 2"],
            "recommendation": "Final recommendation for hiring"
        }}
        
        Analyze the candidate's performance, skills match with the job requirements, and provide
        actionable insights for the hiring team.
        """
        
        # Call Groq API
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=1500
        )
        
        content = chat_completion.choices[0].message.content
        
        # Extract JSON from the response
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        
        if json_start == -1 or json_end == 0:
            return jsonify({"error": "Failed to generate valid analysis format"}), 500
            
        json_str = content[json_start:json_end]
        
        try:
            analysis_data = json.loads(json_str)
        except json.JSONDecodeError as e:
            return jsonify({"error": f"Failed to parse AI response: {str(e)}"}), 500
        
        return jsonify(analysis_data)
        
    except Exception as e:
        print(f"Error in analyze_candidate: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/send-assessment-email', methods=['POST'])
def send_assessment_email():
    try:
        data = request.json
        assessment = data.get('assessment')
        candidate_email = data.get('candidateEmail')
        email_type = data.get('type', 'assigned')
        
        if email_type == 'assigned':
            subject = f"Assessment Invitation: {assessment.get('title', '')}"
            message = f"""Dear Candidate,

You have been invited to take the assessment: {assessment.get('title', '')}

Description: {assessment.get('description', '')}
Time Limit: {assessment.get('timeLimit', 30)} minutes
Job Role: {assessment.get('jobRole', '')}

Please log in to your account to complete the assessment.

Best regards,
Assessment Team
"""
        else: # completed
            subject = f"Assessment Completed: {assessment.get('title', '')}"
            message = f"""Dear Candidate,

You have successfully completed the assessment: {assessment.get('title', '')}

Your results will be reviewed by our team. You will be notified once the evaluation is complete.

Thank you for your participation.

Best regards,
Assessment Team
"""
        
        success = send_email(candidate_email, subject, message)
        return jsonify({'success': success})
        
    except Exception as e:
        print(f"Error in send_assessment_email: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/send-result-email', methods=['POST'])
def send_result_email():
    try:
        data = request.json
        assessment = data.get('assessment')
        submission = data.get('submission')
        candidate = data.get('candidate')
        
        subject = f"Assessment Results: {assessment.get('title', '')}"
        
        if submission.get('passed'):
            message = f"""Dear {candidate.get('name', 'Candidate')},

Congratulations! You have passed the assessment: {assessment.get('title', '')}

Your score: {submission.get('score', 0)}%
Time spent: {submission.get('timeSpent', 'N/A')} minutes

We will be in touch regarding the next steps in the process.

Best regards,
Assessment Team
"""
        else:
            message = f"""Dear {candidate.get('name', 'Candidate')},

Thank you for completing the assessment: {assessment.get('title', '')}

Your score: {submission.get('score', 0)}%
Time spent: {submission.get('timeSpent', 'N/A')} minutes

While you didn't meet the passing criteria this time, we encourage you to continue developing your skills.

Best regards,
Assessment Team
"""
        
        success = send_email(candidate.get('email'), subject, message)
        return jsonify({'success': success})
        
    except Exception as e:
        print(f"Error in send_result_email: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok", 
        "message": "Backend is running",
        "services": {
            "ai_generation": "active",
            "email_service": "active" if EMAIL_USER and EMAIL_PASSWORD else "inactive",
            "violation_reporting": "active",
            "candidate_analysis": "active"
        }
    })

# Gunicorn configuration
if __name__ == '__main__':
    # Check if email service is configured
    if not EMAIL_USER or not EMAIL_PASSWORD:
        print("Warning: Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD environment variables.")
    
    # For development
    app.run(debug=True, port=5001, host='0.0.0.0')
else:
    # For production with Gunicorn
    # This block will be executed when running with Gunicorn
    pass