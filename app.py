from flask import Flask, render_template, request, jsonify, Response
from pymongo import MongoClient
from bson import ObjectId
from bson import json_util
from flask_cors import CORS
import json

# Initialize Flask app
app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# Custom JSON Encoder to handle ObjectId
class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return json.JSONEncoder.default(self, o)

app.json_encoder = JSONEncoder

# MongoDB connection
client = None
try:
    client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=5000)
    client.server_info()  # Test connection
    db = client.todo_app
    print("✅ Successfully connected to MongoDB")
except Exception as e:
    print("❌ MongoDB connection error:", e)
    db = None

# Routes
@app.route('/')
def index():
    return render_template('index.html')

# API Endpoints
@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    if db is None:  # Correct way to check database connection
        return jsonify({'error': 'Database connection failed'}), 500
        
    try:
        tasks = list(db.tasks.find({}))
        # Convert ObjectId to string
        for task in tasks:
            task['_id'] = str(task['_id'])
        return jsonify(tasks)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks', methods=['POST'])
def add_task():
    if db is None:
        return jsonify({'error': 'Database connection failed'}), 500
        
    try:
        task_text = request.json.get('text', '').strip()
        if task_text:
            task = {
                'text': task_text,
                'completed': False
            }
            result = db.tasks.insert_one(task)
            return jsonify({
                '_id': str(result.inserted_id),
                'text': task_text,
                'completed': False
            }), 201
        return jsonify({'error': 'Task text is required'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    if db is None:
        return jsonify({'error': 'Database connection failed'}), 500
        
    try:
        data = request.json
        db.tasks.update_one(
            {'_id': ObjectId(task_id)},
            {'$set': {'completed': data.get('completed', False)}}
        )
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    if db is None:
        return jsonify({'error': 'Database connection failed'}), 500
        
    try:
        db.tasks.delete_one({'_id': ObjectId(task_id)})
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/clear', methods=['DELETE'])
def clear_all_tasks():
    if db is None:
        return jsonify({'error': 'Database connection failed'}), 500
        
    try:
        db.tasks.delete_many({})
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)