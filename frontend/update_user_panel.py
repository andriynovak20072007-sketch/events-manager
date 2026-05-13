import os
import glob

# 1. Update style.css
style_file = 'd:/Desktop/VS/frontend/css/style.css'
with open(style_file, 'r', encoding='utf-8') as f:
    style_content = f.read()

css_to_add = """
/* Guest state for user panel */
.panel-guest-state {
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 40px 24px;
    flex-grow: 1;
}

.guest-icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, rgba(40, 84, 197, 0.1) 0%, rgba(0, 170, 255, 0.1) 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
}

.guest-icon i {
    font-size: 36px;
    background: linear-gradient(135deg, #2854C5 0%, #00AAFF 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.panel-guest-state h3 {
    font-size: 22px;
    font-weight: 800;
    color: #0F172A;
    margin: 0 0 12px 0;
}

.panel-guest-state p {
    font-size: 14px;
    color: #64748B;
    line-height: 1.5;
    margin: 0;
}
"""

if "panel-guest-state" not in style_content:
    with open(style_file, 'a', encoding='utf-8') as f:
        f.write(css_to_add)
    print("Added guest state CSS to style.css")

css_override = """
/* Updated Panel Buttons */
.panel-auth-btn {
  padding: 16px !important; 
  border-radius: 16px !important; 
  font-weight: 700 !important; 
  font-family: 'Montserrat', sans-serif !important;
  cursor: pointer !important; 
  border: none !important; 
  font-size: 16px !important;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important;
}

.panel-auth-btn:hover {
  transform: translateY(-3px) !important;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
}

.login-btn { 
  background: #F1F5F9 !important; 
  color: #0F172A !important; 
}

.login-btn:hover {
  background: #E2E8F0 !important;
}

.register-btn { 
  background: linear-gradient(135deg, #2854C5 0%, #00AAFF 100%) !important; 
  color: white !important; 
  box-shadow: 0 8px 20px rgba(40, 84, 197, 0.25) !important;
}

.register-btn:hover {
  box-shadow: 0 12px 25px rgba(40, 84, 197, 0.35) !important;
}
"""
if "Updated Panel Buttons" not in style_content:
    with open(style_file, 'a', encoding='utf-8') as f:
        f.write(css_override)
    print("Added auth btn override CSS to style.css")


# 2. Update all HTML files
html_files = glob.glob('d:/Desktop/VS/frontend/css/*.html')

guest_html = """
  <!-- Guest State (Shown when logged out) -->
  <div class="panel-guest-state" id="panelGuestState">
    <div class="guest-icon">
      <i class="fa-solid fa-user-astronaut"></i>
    </div>
    <h3>Приєднуйтесь до нас!</h3>
    <p>Увійдіть, щоб керувати подіями, зберігати обране та купувати квитки.</p>
  </div>
"""

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '<div class="panel-guest-state"' not in content and '<nav class="panel-nav">' in content:
        content = content.replace('<nav class="panel-nav">', guest_html + '\n  <nav class="panel-nav">')
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file}")
