from flask import Flask, render_template, request, jsonify
from datetime import datetime
from analyzer import PromptAnalyzer

app = Flask(__name__)
analyzer = PromptAnalyzer()

# In-memory storage for demo (would use proper DB in production)
scan_history = []
free_scans_count = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze_prompt():
    data = request.json
    prompt_text = data.get('prompt', '')
    user_id = data.get('user_id', 'anonymous')
    
    # Check free tier limits
    current_month = datetime.now().strftime('%Y-%m')
    user_key = f"{user_id}-{current_month}"
    
    if user_key not in free_scans_count:
        free_scans_count[user_key] = 0
    
    if free_scans_count[user_key] >= 5:
        return jsonify({'error': 'Free scan limit reached (5/month)'}), 403
    
    # Analyze the prompt
    result = analyzer.analyze(prompt_text)
    
    # Track usage
    free_scans_count[user_key] += 1
    scan_history.append({
        'timestamp': datetime.now().isoformat(),
        'user_id': user_id,
        'prompt_length': len(prompt_text),
        'issues_found': len(result['issues'])
    })
    
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
