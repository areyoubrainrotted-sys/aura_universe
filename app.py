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

@app.route('/launch-server', methods=['POST'])
def launch_server():
    try:
        data = request.json
        
        # Insert data into your Supabase table
        # Ensure your column names in Supabase match these keys!
        response = supabase.table("aura_servers").insert({
            "server_name": data.get("serverName"),
            "description": data.get("serverDesc"),
            "category": data.get("category"),
            "size_goal": data.get("serverSize"),
            "plan": data.get("plan"),
            "extras": data.get("extras"),
            "contact_email": data.get("email")
        }).execute()

        return jsonify({"status": "success", "message": "Aura Core Initialized!"}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 400

if __name__ == '__main__':
    # Codespaces usually prefers port 5000 or 8080
    app.run(debug=True, port=5000)
