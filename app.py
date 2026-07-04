import os
import joblib
import numpy as np
import pandas as pd
from flask import Flask, render_template, request, jsonify
from datetime import datetime

app = Flask(__name__)

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'xgboost_accident_model.pkl')
model = None

print("Current directory:", os.getcwd())
print("Files:", os.listdir(os.path.dirname(os.path.abspath(__file__))))
print("Model path:", MODEL_PATH)

def load_model():
    global model
    try:
        model = joblib.load(MODEL_PATH)
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Model loading failed: {e}")
        model = None

load_model()

STATE_ENCODING = {
    'AK': 0, 'AL': 1, 'AR': 2, 'AZ': 3, 'CA': 4, 'CO': 5, 'CT': 6,
    'DC': 7, 'DE': 8, 'FL': 9, 'GA': 10, 'HI': 11, 'IA': 12, 'ID': 13,
    'IL': 14, 'IN': 15, 'KS': 16, 'KY': 17, 'LA': 18, 'MA': 19,
    'MD': 20, 'ME': 21, 'MI': 22, 'MN': 23, 'MO': 24, 'MS': 25,
    'MT': 26, 'NC': 27, 'ND': 28, 'NE': 29, 'NH': 30, 'NJ': 31,
    'NM': 32, 'NV': 33, 'NY': 34, 'OH': 35, 'OK': 36, 'OR': 37,
    'PA': 38, 'RI': 39, 'SC': 40, 'SD': 41, 'TN': 42, 'TX': 43,
    'UT': 44, 'VA': 45, 'VT': 46, 'WA': 47, 'WI': 48, 'WV': 49, 'WY': 50
}

TIMEZONE_ENCODING = {
    'US/Alaska': 0, 'US/Central': 1, 'US/Eastern': 2,
    'US/Hawaii': 3, 'US/Mountain': 4, 'US/Pacific': 5
}

WIND_DIRECTION_ENCODING = {
    'CALM': 0, 'E': 1, 'ENE': 2, 'ESE': 3, 'N': 4, 'NE': 5,
    'NNE': 6, 'NNW': 7, 'NW': 8, 'S': 9, 'SE': 10, 'SSE': 11,
    'SSW': 12, 'SW': 13, 'VAR': 14, 'W': 15, 'WNW': 16, 'WSW': 17
}

WEATHER_CONDITION_ENCODING = {
    'Clear': 0, 'Cloudy': 1, 'Drizzle': 2, 'Dust Whirls': 3,
    'Fair': 4, 'Fog': 5, 'Freezing Drizzle': 6, 'Freezing Rain': 7,
    'Funnel Cloud': 8, 'Hail': 9, 'Haze': 10, 'Heavy Drizzle': 11,
    'Heavy Rain': 12, 'Heavy Snow': 13, 'Heavy T-Storm': 14,
    'Ice Crystals': 15, 'Light Drizzle': 16, 'Light Freezing Drizzle': 17,
    'Light Freezing Rain': 18, 'Light Hail': 19, 'Light Rain': 20,
    'Light Rain Shower': 21, 'Light Sleet': 22, 'Light Snow': 23,
    'Light Snow Shower': 24, 'Light Thunderstorms and Rain': 25,
    'Mostly Cloudy': 26, 'Mist': 27, 'Overcast': 28, 'Partial Fog': 29,
    'Partly Cloudy': 30, 'Patches of Fog': 31, 'Rain': 32,
    'Rain Shower': 33, 'Sand': 34, 'Scattered Clouds': 35,
    'Showers in the Vicinity': 36, 'Sleet': 37, 'Smoke': 38,
    'Snow': 39, 'Squalls': 40, 'Thunder': 41,
    'Thunderstorm': 42, 'T-Storm': 43, 'Widespread Dust': 44,
    'Wintry Mix': 45
}

SOURCE_ENCODING = {
    'Source1': 0, 'Source2': 1
}

SEVERITY_INFO = {
    1: {
        'label': 'Very Safe',
        'color': '#22c55e',
        'bg': 'rgba(34,197,94,0.15)',
        'icon': '🟢',
        'message': 'Travel conditions are safe.',
        'recommendation': 'Proceed with normal caution. Road conditions are favorable.',
        'meter': 10
    },
    2: {
        'label': 'Moderate Risk',
        'color': '#eab308',
        'bg': 'rgba(234,179,8,0.15)',
        'icon': '🟡',
        'message': 'Moderate accident risk detected.',
        'recommendation': 'Drive carefully and follow all traffic rules. Stay alert.',
        'meter': 40
    },
    3: {
        'label': 'High Risk',
        'color': '#f97316',
        'bg': 'rgba(249,115,22,0.15)',
        'icon': '🟠',
        'message': 'High accident risk in this area.',
        'recommendation': 'Travel cautiously. Avoid distractions and reduce speed.',
        'meter': 70
    },
    4: {
        'label': 'Dangerous',
        'color': '#ef4444',
        'bg': 'rgba(239,68,68,0.15)',
        'icon': '🔴',
        'message': 'Extremely dangerous road conditions.',
        'recommendation': 'Avoid travel if possible. If you must travel, take extreme caution.',
        'meter': 95
    }
}

prediction_history = []

FEATURES = [
    'Start_Lat', 'Start_Lng', 'End_Lat', 'End_Lng', 'Distance(mi)',
    'Temperature(F)', 'Wind_Chill(F)', 'Humidity(%)', 'Pressure(in)',
    'Visibility(mi)', 'Wind_Speed(mph)', 'Precipitation(in)',
    'Year', 'Month', 'Day', 'Hour', 'Weekday',
    'State', 'City', 'County', 'Timezone',
    'Wind_Direction', 'Weather_Condition', 'Source'
]

@app.route('/favicon.ico')
def favicon():
    return app.send_static_file('favicon.svg'), 200, {'Content-Type': 'image/svg+xml'}

@app.route('/')
def index():
    return render_template('index.html',
                           states=STATE_ENCODING,
                           timezones=TIMEZONE_ENCODING,
                           wind_directions=WIND_DIRECTION_ENCODING,
                           weather_conditions=WEATHER_CONDITION_ENCODING,
                           sources=SOURCE_ENCODING)

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Model not loaded. Please check server logs.'}), 500

    try:
        data = request.get_json()

        state_val = STATE_ENCODING.get(data.get('State', 'OH'), 35)
        tz_val = TIMEZONE_ENCODING.get(data.get('Timezone', 'US/Eastern'), 2)
        wd_val = WIND_DIRECTION_ENCODING.get(data.get('Wind_Direction', 'N'), 4)
        wc_val = WEATHER_CONDITION_ENCODING.get(data.get('Weather_Condition', 'Clear'), 0)
        src_val = SOURCE_ENCODING.get(data.get('Source', 'Source2'), 1)

        feature_values = [
            float(data.get('Start_Lat', 39.865)),
            float(data.get('Start_Lng', -84.059)),
            float(data.get('End_Lat', 0.0)),
            float(data.get('End_Lng', 0.0)),
            float(data.get('Distance_mi', 0.01)),
            float(data.get('Temperature_F', 65.0)),
            float(data.get('Wind_Chill_F', 65.0)),
            float(data.get('Humidity_pct', 60.0)),
            float(data.get('Pressure_in', 29.97)),
            float(data.get('Visibility_mi', 10.0)),
            float(data.get('Wind_Speed_mph', 8.0)),
            float(data.get('Precipitation_in', 0.0)),
            int(data.get('Year', 2024)),
            int(data.get('Month', 6)),
            int(data.get('Day', 15)),
            int(data.get('Hour', 12)),
            int(data.get('Weekday', 5)),
            state_val,
            int(data.get('City', 221)),
            int(data.get('County', 59)),
            tz_val,
            wd_val,
            wc_val,
            src_val
        ]

        input_df = pd.DataFrame([feature_values], columns=FEATURES)
        raw_pred = model.predict(input_df)[0]
        severity = int(raw_pred) + 1

        if severity < 1:
            severity = 1
        if severity > 4:
            severity = 4

        info = SEVERITY_INFO[severity]

        history_entry = {
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'severity': severity,
            'label': info['label'],
            'icon': info['icon'],
            'location': f"{data.get('Start_Lat', 'N/A')}, {data.get('Start_Lng', 'N/A')}"
        }
        prediction_history.insert(0, history_entry)
        if len(prediction_history) > 10:
            prediction_history.pop()

        return jsonify({
            'severity': severity,
            'label': info['label'],
            'color': info['color'],
            'bg': info['bg'],
            'icon': info['icon'],
            'message': info['message'],
            'recommendation': info['recommendation'],
            'meter': info['meter'],
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })

    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 400

@app.route('/history')
def get_history():
    return jsonify(prediction_history)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Flask on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
