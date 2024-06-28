from flask import Flask, render_template, request, redirect, url_for
import json
import requests
import os
from apscheduler.schedulers.background import BackgroundScheduler

app = Flask(__name__)
app.config['JSON_DATABASE'] = 'leaderboard.json'

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

# Function to update sessions from API
def update_sessions():
    data = load_data()
    for slack_id, user_data in data.items():
        api_url = f'https://hackhour.hackclub.com/api/stats/{slack_id}'
        try:
            response = requests.get(api_url)
            if response.status_code == 200:
                api_data = response.json()
                sessions = api_data['data']['sessions']
                user_data['sessions'] = sessions
            else:
                print(f"Failed to fetch data from API for {slack_id}: {response.status_code}")
        except Exception as e:
            print(f"Error updating sessions for {slack_id}: {str(e)}")
    save_data(data)

# Scheduler to update sessions every 25 minutes
scheduler = BackgroundScheduler()
scheduler.add_job(func=update_sessions, trigger='interval', minutes=25)
scheduler.start()

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
        api_url = f'https://hackhour.hackclub.com/api/stats/{slack_id}'
        try:
            response = requests.get(api_url)
            if response.status_code == 200:
                api_data = response.json()
                sessions = api_data['data']['sessions']
            else:
                print(f"Failed to fetch data from API for {slack_id}: {response.status_code}")
                sessions = 0
        except Exception as e:
            print(f"Error fetching data from API for {slack_id}: {str(e)}")
            sessions = 0
        
        data[slack_id] = {
            'username': username,
            'sessions': sessions
        }
        save_data(data)
    
    return redirect(url_for('leaderboard'))

if __name__ == '__main__':
    app.run(debug=True)