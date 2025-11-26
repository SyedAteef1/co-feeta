from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from bson.objectid import ObjectId
import jwt
import os

auth_bp = Blueprint('auth', __name__)
JWT_SECRET = os.getenv('FLASK_SECRET', 'change_this_secret')

users_collection = None


def get_users_collection():
    """Get users collection (lazy initialization)"""
    global users_collection
    if users_collection is None:
        from app.database.mongodb import db
        users_collection = db.users
        users_collection.create_index([("email", 1)], unique=True)
    return users_collection

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    
    collection = get_users_collection()
    if collection.find_one({"email": email}):
        return jsonify({"error": "Email already exists"}), 400
    
    user = {
        "email": email,
        "password": generate_password_hash(password),
        "name": name or email.split("@")[0],
        "created_at": datetime.utcnow()
    }
    
    result = collection.insert_one(user)
    user_id = str(result.inserted_id)
    
    token = jwt.encode({
        "user_id": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=30)
    }, JWT_SECRET, algorithm="HS256")
    
    return jsonify({
        "ok": True,
        "token": token,
        "user": {"id": user_id, "email": email, "name": user["name"]}
    })

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    
    collection = get_users_collection()
    user = collection.find_one({"email": email})
    if not user or not check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid credentials"}), 401
    
    user_id = str(user["_id"])
    
    token = jwt.encode({
        "user_id": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=30)
    }, JWT_SECRET, algorithm="HS256")
    
    return jsonify({
        "ok": True,
        "token": token,
        "user": {"id": user_id, "email": email, "name": user.get("name", email)}
    })

@auth_bp.route("/logout", methods=["POST"])
def logout():
    return jsonify({"ok": True})

@auth_bp.route("/me", methods=["GET"])
def get_current_user():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({"authenticated": False}), 401
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        collection = get_users_collection()
        user = collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"authenticated": False}), 401
        
        has_github = bool(user.get("github_token"))
        print(f"User {user['email']} - GitHub token exists: {has_github}")
        
        return jsonify({
            "authenticated": True,
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "name": user.get("name", user["email"]),
                "github_connected": has_github
            }
        })
    except jwt.ExpiredSignatureError:
        return jsonify({"authenticated": False, "error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"authenticated": False, "error": "Invalid token"}), 401

@auth_bp.route("/send-otp", methods=["POST"])
def send_otp():
    """Send OTP for signup"""
    try:
        data = request.get_json()
        email = data.get("email")
        
        if not email:
            return jsonify({"error": "Email required"}), 400
            
        # Check if user already exists
        collection = get_users_collection()
        if collection.find_one({"email": email}):
            return jsonify({"error": "Email already registered. Please login."}), 400
            
        # Generate 6-digit OTP
        import random
        otp = str(random.randint(100000, 999999))
        
        # Store OTP in db (with expiration)
        from app.database.mongodb import db
        otp_collection = db.otp_codes
        otp_collection.create_index("createdAt", expireAfterSeconds=300) # 5 mins expiry
        
        otp_collection.update_one(
            {"email": email},
            {"$set": {
                "otp": otp,
                "createdAt": datetime.utcnow()
            }},
            upsert=True
        )
        
        # Send Email
        from app import mail
        from flask_mail import Message
        from flask import current_app
        
        msg = Message(
            subject="Your Feeta Verification Code",
            recipients=[email],
            body=f"Your verification code is: {otp}\n\nThis code expires in 5 minutes.",
            sender=current_app.config['MAIL_USERNAME']
        )
        mail.send(msg)
        
        return jsonify({"ok": True, "message": "OTP sent successfully"})
        
    except Exception as e:
        print(f"Send OTP error: {e}")
        return jsonify({"error": "Failed to send OTP"}), 500

@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    """Verify OTP and create account"""
    try:
        data = request.get_json()
        email = data.get("email")
        otp = data.get("otp")
        name = data.get("name")
        password = data.get("password")
        
        if not email or not otp or not password:
            return jsonify({"error": "Missing required fields"}), 400
            
        # Verify OTP
        from app.database.mongodb import db
        otp_collection = db.otp_codes
        record = otp_collection.find_one({"email": email})
        
        if not record or record.get("otp") != otp:
            return jsonify({"error": "Invalid or expired OTP"}), 400
            
        # Create User
        collection = get_users_collection()
        if collection.find_one({"email": email}):
            return jsonify({"error": "User already exists"}), 400
            
        user = {
            "email": email,
            "password": generate_password_hash(password),
            "name": name or email.split("@")[0],
            "created_at": datetime.utcnow()
        }
        
        result = collection.insert_one(user)
        user_id = str(result.inserted_id)
        
        # Delete used OTP
        otp_collection.delete_one({"email": email})
        
        # Generate Token
        token = jwt.encode({
            "user_id": user_id,
            "email": email,
            "exp": datetime.utcnow() + timedelta(days=30)
        }, JWT_SECRET, algorithm="HS256")
        
        return jsonify({
            "ok": True,
            "token": token,
            "user": {"id": user_id, "email": email, "name": user["name"]}
        })
        
    except Exception as e:
        print(f"Verify OTP error: {e}")
        return jsonify({"error": "Verification failed"}), 500
