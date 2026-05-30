import os
import random
import sqlite3
import urllib.parse
import uuid
import requests
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
DB_FILE = 'database.db'
IMAGES_DIR = os.path.join('static', 'images')

# Ensure generation directory exists
os.makedirs(IMAGES_DIR, exist_ok=True)

# --- SQLite DATABASE INTEGRATION ---
def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prompt TEXT NOT NULL,
            style TEXT NOT NULL,
            aspect_ratio TEXT NOT NULL,
            width INTEGER NOT NULL,
            height INTEGER NOT NULL,
            filename TEXT NOT NULL,
            seed INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Initialize DB on startup
init_db()

# --- ROUTES ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate_image():
    try:
        data = request.json or {}
        raw_prompt = data.get('prompt', '').strip()
        style = data.get('style', 'none')
        aspect_ratio = data.get('aspect_ratio', '1:1')
        width = int(data.get('width', 1024))
        height = int(data.get('height', 1024))

        if not raw_prompt:
            return jsonify({'success': False, 'message': 'Prompt is required'}), 400

        # Generate a random seed
        seed = random.randint(10000000, 99999999)

        # Style Modifiers Injection
        style_modifiers = {
            'cinematic': ', cinematic photography, dramatic lighting, shot on 35mm lens, highly detailed, photorealistic, 8k resolution',
            'anime': ', vibrant anime style, detailed digital illustration, macro details, colorful, studio ghibli aesthetic, masterpiece',
            'cyberpunk': ', cyberpunk aesthetic, neon glowing colors, rain-slick streets, futuristic city background, octane render, 8k',
            '3d-render': ', stunning 3d render, blender octane rendering, smooth clay textures, ray tracing, cute volumetric lighting',
            'fantasy': ', high fantasy digital art, mythical creatures, mystical magic elements, glowing runes, cinematic scale',
            'oil-painting': ', detailed classical oil painting, textured thick brush strokes, fine art museum style, warm lighting',
            'pixel-art': ', retro 8-bit pixel art style, blocky colors, old school arcade game resolution'
        }

        style_suffix = style_modifiers.get(style, '')
        final_prompt = raw_prompt + style_suffix

        # Encode prompt for URL
        encoded_prompt = urllib.parse.quote(final_prompt)

        # Simulate browser request headers to bypass CDN / Cloudflare anti-bot blocks
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }

        # Multi-attempt model fallbacks and resolution downscales to bypass high-load timeouts and 402/429 limits
        response = None
        last_error_msg = "API failed to respond"
        
        # Attempts Configuration:
        # 1. Default high-quality model (unspecified) at original size
        # 2. Fast/Free model ('turbo') at original size (immune to anonymous paid blocks)
        # 3. Default model downscaled to 75%
        # 4. 'Turbo' model downscaled to 75%
        # 5. 'Turbo' model at completely safe fallback resolution (512x512)
        attempts_config = [
            (None, width, height),
            ("turbo", width, height),
            (None, int(width * 0.75) if width > 512 else width, int(height * 0.75) if height > 512 else height),
            ("turbo", int(width * 0.75) if width > 512 else width, int(height * 0.75) if height > 512 else height),
            ("turbo", 512, 512)
        ]

        final_width, final_height = width, height

        for idx, (current_model, current_w, current_h) in enumerate(attempts_config):
            # Format model parameter if defined
            model_param = f"&model={current_model}" if current_model else ""
            api_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={current_w}&height={current_h}&seed={seed}&nologo=true{model_param}"
            
            try:
                # Add unique cache bypass query param to force generation
                attempt_url = api_url + f"&cache_bypass={uuid.uuid4().hex}"
                print(f"[IMAGIX LOG] Calling API - Model: {current_model or 'default'}, Dim: {current_w}x{current_h}, Level: {idx+1}")
                
                response = requests.get(attempt_url, headers=headers, timeout=20)
                
                if response.status_code == 200 and len(response.content) > 1000:
                    final_width, final_height = current_w, current_h
                    print(f"[IMAGIX SUCCESS] Synthesized successfully on Level {idx+1}!")
                    break
                else:
                    last_error_msg = f"HTTP {response.status_code} returned"
                    print(f"[IMAGIX WARNING] Attempt Level {idx+1} returned status {response.status_code}")
            except Exception as e:
                last_error_msg = str(e)
                print(f"[IMAGIX WARNING] Attempt Level {idx+1} failed: {str(e)}")

        if not response or response.status_code != 200 or len(response.content) <= 1000:
            return jsonify({
                'success': False, 
                'message': f"AI Image synthesis failed: {last_error_msg}. The generation engine is under extremely high load or anonymous credits limit is exceeded. Please try again in a few seconds."
            }), 502

        # Create a unique filename
        filename = f"gen_{uuid.uuid4().hex}.jpg"
        file_path = os.path.join(IMAGES_DIR, filename)

        # Save image locally
        with open(file_path, 'wb') as f:
            f.write(response.content)

        # Insert metadata into SQLite
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO images (prompt, style, aspect_ratio, width, height, filename, seed)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (raw_prompt, style, aspect_ratio, final_width, final_height, filename, seed))
        conn.commit()
        
        new_id = cursor.lastrowid
        conn.close()

        return jsonify({
            'success': True,
            'id': new_id,
            'filename': filename,
            'prompt': raw_prompt,
            'style': style,
            'aspect_ratio': aspect_ratio,
            'width': final_width,
            'height': final_height,
            'seed': seed
        })

    except Exception as e:
        print(f"[IMAGIX ERROR] Trace: {str(e)}")
        return jsonify({'success': False, 'message': f"Internal Server Error: {str(e)}"}), 500

@app.route('/history', methods=['GET'])
def get_history():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        rows = cursor.execute('SELECT * FROM images ORDER BY created_at DESC').fetchall()
        conn.close()

        history = []
        for row in rows:
            history.append({
                'id': row['id'],
                'prompt': row['prompt'],
                'style': row['style'],
                'aspect_ratio': row['aspect_ratio'],
                'width': row['width'],
                'height': row['height'],
                'filename': row['filename'],
                'seed': row['seed'],
                'created_at': row['created_at']
            })

        return jsonify({'success': True, 'history': history})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/delete/<int:image_id>', methods=['DELETE'])
def delete_image(image_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        row = cursor.execute('SELECT filename FROM images WHERE id = ?', (image_id,)).fetchone()
        
        if not row:
            conn.close()
            return jsonify({'success': False, 'message': 'Asset not found'}), 404

        filename = row['filename']
        file_path = os.path.join(IMAGES_DIR, filename)

        # Delete local file if it exists
        if os.path.exists(file_path):
            os.remove(file_path)

        # Delete record from database
        cursor.execute('DELETE FROM images WHERE id = ?', (image_id,))
        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': 'Asset deleted successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/delete-all', methods=['POST'])
def clear_all_history():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        rows = cursor.execute('SELECT filename FROM images').fetchall()

        # Delete all files locally
        for row in rows:
            file_path = os.path.join(IMAGES_DIR, row['filename'])
            if os.path.exists(file_path):
                os.remove(file_path)

        # Wipe SQLite records
        cursor.execute('DELETE FROM images')
        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': 'Entire generation history wiped'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    # Run locally on standard port 5000
    app.run(debug=True, host='127.0.0.1', port=5000)
