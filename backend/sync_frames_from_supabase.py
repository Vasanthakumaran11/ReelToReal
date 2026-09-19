import os
import sys
import hashlib
import requests
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')
load_dotenv()

ROOT_DIR = Path(__file__).resolve().parent.parent
FRAMES_DIR = ROOT_DIR / "frames"
FRAMES_DIR.mkdir(parents=True, exist_ok=True)

url = os.getenv('SUPABASE_URL')
sec_key = os.getenv('SUPABASE_SECRET_KEY')
pub_key = os.getenv('SUPABASE_PUBLISHABLE_KEY')

h = {'apikey': sec_key, 'Authorization': f'Bearer {sec_key}'}

# 1. Fetch all reels from DB
r = requests.get(f"{url}/rest/v1/reels?select=*", headers=h)
reels = r.json()

# 2. Build mapping of storage folder -> video_id
# 13 folders match reel_{sha256(video_id)[:20]}
# reel_23fe92cad1be79fe4644 maps to Namma Veettu Virundhu
folder_to_videoid = {}
videoid_to_folder = {}

for reel in reels:
    vid = reel.get('video_id', '')
    sha20 = f"reel_{hashlib.sha256(vid.encode('utf-8')).hexdigest()[:20]}"
    folder_to_videoid[sha20] = vid
    videoid_to_folder[vid] = sha20

# Namma Veettu Virundhu special mapping to reel_23fe92cad1be79fe4644
for reel in reels:
    if reel.get('place') == 'Namma Veettu Virundhu':
        folder_to_videoid['reel_23fe92cad1be79fe4644'] = reel['video_id']
        videoid_to_folder[reel['video_id']] = 'reel_23fe92cad1be79fe4644'

print(f"Mapped {len(folder_to_videoid)} storage folders to reels.")

def download_file(args):
    folder, file_name, dest_path = args
    if dest_path.exists() and dest_path.stat().st_size > 0:
        return True
    download_url = f"{url}/storage/v1/object/public/reel-frames/{folder}/{file_name}"
    try:
        resp = requests.get(download_url, timeout=15)
        if resp.status_code == 200:
            dest_path.write_bytes(resp.content)
            return True
        else:
            print(f"[Error] Failed to download {download_url}: {resp.status_code}")
    except Exception as e:
        print(f"[Error] Exception downloading {file_name}: {e}")
    return False

# List objects in bucket
list_url = f"{url}/storage/v1/object/list/reel-frames"
res = requests.post(list_url, headers=h, json={'prefix': '', 'limit': 100})
storage_folders = [o['name'] for o in res.json()]

print(f"\nDownloading frames into {FRAMES_DIR}...")
tasks = []
for folder in storage_folders:
    vid = folder_to_videoid.get(folder)
    if not vid:
        print(f"Skipping unmapped folder: {folder}")
        continue
    
    # Target directory on local disk
    target_dir = FRAMES_DIR / vid
    target_dir.mkdir(parents=True, exist_ok=True)
    
    # Get all frames in this folder
    f_res = requests.post(list_url, headers=h, json={'prefix': folder + '/', 'limit': 200})
    files = [f['name'] for f in f_res.json()]
    print(f"Queuing {len(files)} frames for '{vid[:40]}' (folder: {folder})")
    for fname in files:
        dest = target_dir / fname
        tasks.append((folder, fname, dest))

print(f"\nTotal frame files to sync: {len(tasks)}")
with ThreadPoolExecutor(max_workers=16) as executor:
    results = list(executor.map(download_file, tasks))

success_count = sum(1 for r in results if r)
print(f"\nSuccessfully downloaded {success_count}/{len(tasks)} frames to {FRAMES_DIR}!")
