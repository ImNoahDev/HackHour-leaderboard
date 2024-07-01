from flask import Flask, render_template, request, redirect, url_for
import json
import requests
import os
from datetime import datetime, timedelta

app = Flask(__name__)
app.config['JSON_DATABASE'] = 'leaderboard.json'
app.config['LAST_UPDATE_TIME'] = None
app.config['UPDATE_INTERVAL'] = timedelta(minutes=5)

# Function to load data from JSON file
def load_data():
    data = {}
    if os.path.exists(app.config['JSON_DATABASE']):
        with open(app.config['JSON_DATABASE'], 'r') as f:
            data = json.load(f)
    return data

# Function to save data to JSON file
def save_data(data):
    with open(app.config['JSON_DATABASE'], 'w') as f:
        json.dump(data, f, indent=4)

# Function to fetch sessions from API
def fetch_sessions(slack_id):
    api_url = f'https://hackhour.hackclub.com/api/stats/{slack_id}'
    try:
        response = requests.get(api_url)
        if response.status_code == 200:
            api_data = response.json()
            sessions = api_data.get('data', {}).get('sessions', 0)
            print(f"Fetched {sessions} sessions for {slack_id}")
            return sessions
        else:
            print(f"Failed to fetch data from API for {slack_id}: {response.status_code}")
            return 0
    except Exception as e:
        print(f"Error fetching data from API for {slack_id}: {str(e)}")
        return 0

# Function to update sessions data periodically
def update_sessions_periodically():
    data = load_data()
    for slack_id in data.keys():
        sessions = fetch_sessions(slack_id)
        data[slack_id]['sessions'] = sessions
    save_data(data)
    app.config['LAST_UPDATE_TIME'] = datetime.now()

# Check if update is needed before each request
@app.before_request
def check_update_sessions():
    if app.config['LAST_UPDATE_TIME'] is None or datetime.now() - app.config['LAST_UPDATE_TIME'] > app.config['UPDATE_INTERVAL']:
        update_sessions_periodically()

# Routes
@app.route('/')
def leaderboard():
    data = load_data()
    sorted_users = sorted(data.values(), key=lambda x: x['sessions'], reverse=True)[:100]
    return render_template('leaderboard.html', users=sorted_users)

@app.route('/add_user', methods=['POST'])
def add_user():
    slack_id = request.form['slack_id']
    username = request.form['username']

    data = load_data()
    if slack_id not in data:
        sessions = fetch_sessions(slack_id)

        data[slack_id] = {
            'username': username,
            'sessions': sessions
        }
        save_data(data)

    return redirect(url_for('leaderboard'))

if __name__ == '__main__':
    app.run(debug=True)
