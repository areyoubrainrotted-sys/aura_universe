import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# These pull from your .env file
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(url, key)

@app.route('/api/register-server', methods=['POST'])
def register_server():
    """Register server after bot has been added (with guild_id)"""
    try:
        data = request.json
        
        # Insert data into Supabase table with guild_id
        response = supabase.table("aura_servers").insert({
            "guild_id": data.get("guild_id"),           # Discord server ID
            "server_name": data.get("server_name"),
            "description": data.get("description"),
            "category": data.get("category"),
            "size_goal": data.get("server_size"),
            "invite_code": data.get("invite_code"),
            "contact_email": data.get("email"),
            "registered_at": data.get("registered_at"),
            "status": "active"
        }).execute()

        return jsonify({"status": "success", "message": "Server registered successfully!"}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/notify-premium', methods=['POST'])
def notify_premium():
    """Save email for premium notification waitlist"""
    try:
        data = request.json
        email = data.get("email")
        
        if not email:
            return jsonify({"status": "error", "message": "Email required"}), 400
        
        response = supabase.table("premium_waitlist").insert({
            "email": email,
            "subscribed_at": datetime.now().isoformat()
        }).execute()
        
        return jsonify({"status": "success", "message": "Added to waitlist!"}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/server-stats', methods=['GET'])
def server_stats():
    """Get total registered servers count"""
    try:
        response = supabase.table("aura_servers").select("guild_id", count="exact").execute()
        count = len(response.data)
        return jsonify({"status": "success", "total_servers": count}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
