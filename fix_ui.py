import os

replacements = {
    'Ã°Å¸â€˜â€¹': '👋',
    'Ã¢Å“â€¦': '✅',
    'Ã¢â‚¬â€œ': '–',
    'Ã¢â‚¬â€ ': '—',
    'Ã¢â‚¬Â¦': '…',
    'Ã°Å¸Â©Âº': '🩺',
    'Ã¢Â Â¤Ã¯Â¸Â ': '❤️',
    'Ã°Å¸Â§Â ': '🧠',
    'Ã°Å¸â€˜Â¶': '👶',
    'Ã°Å¸Å’Â¿': '🌿',
    'Ã°Å¸Â«Â ': '🫁',
    'Ã°Å¸â€ Â¬': '🔬',
    'Ã°Å¸Â¦Â´': '🦴',
    'Ã°Å¸â€™Â­': '💭',
    'Ã°Å¸â€˜â€š': '👂',
    'Ã°Å¸Å’Â¸': '🌸',
    'Ã°Å¸â€ Â´': '🔴',
    'Ã‚Â·': '·',
    'Ã¢â€ â‚¬Ã¢â€ â‚¬': '──',
    'Ã°Å¸Å½Â¤': '🎤',
    'Ã‚©': '©',
    'Ã¢â‚¬Â¢': '•',
    'Ã¢â€ â€™': '→',
    'Ã¢Å¡Â Ã¯Â¸Â ': '⚠️',
    'Ã°Å¸â€˜Â¤': '👤',
    'Ã°Å¸â€˜Â¨Ã¢â‚¬Â Ã¢Å¡•Ã¯Â¸Â ': '👨‍⚕️',
    'Ã¢Â Â³': '⏳',
    'Ã°Å¸â€“Å Ã¯Â¸Â ': '🖊️',
    'Ã°Å¸â€™Å ': '💊',
    'Ã¢Å“â€œ': '✅',
    'Ã¢•Â ': '═',
    'Ã¢â€ Â ': '↳'
}

for root, _, files in os.walk(r'frontend\src'):
    for file in files:
        if file.endswith('.jsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            for k, v in replacements.items():
                content = content.replace(k, v)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
print('UI text cleanup done')
