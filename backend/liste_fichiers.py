 # Sonde : liste les fichiers restants dans backend/
import os

with open(r"c:\Users\HP\.vscode\GradeTrack-Evolve\backend\fichiers.txt", "w", encoding="utf-8") as f:
    for racine, _, fichiers in os.walk(r"c:\Users\HP\.vscode\GradeTrack-Evolve\backend"):
        if "__pycache__" in racine or ".pytest_cache" in racine:
            continue
        for nom in sorted(fichiers):
            f.write(os.path.join(racine, nom) + "\n")
