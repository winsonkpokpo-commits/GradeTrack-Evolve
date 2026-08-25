# Lanceur de vérifications : typecheck TypeScript + tests backend pytest,
# résultats écrits dans backend/verifications.txt (shell VS Code instable).
import subprocess
import sys

RACINE = r"c:\Users\HP\.vscode\GradeTrack-Evolve"
SORTIE = RACINE + r"\backend\verifications.txt"

parties = []

# 1. Typecheck TypeScript strict (projet Next.js)
tsc = subprocess.run(
    "npx tsc --noEmit",
    capture_output=True,
    text=True,
    cwd=RACINE,
    shell=True,
)
parties.append(f"=== tsc --noEmit (exit={tsc.returncode}) ===\n{tsc.stdout}\n{tsc.stderr}")

# 2. Tests backend complets
pytest = subprocess.run(
    [sys.executable, "-m", "pytest", "tests", "-v"],
    capture_output=True,
    text=True,
    cwd=RACINE + r"\backend",
)
parties.append(f"=== pytest backend (exit={pytest.returncode}) ===\n{pytest.stdout}\n{pytest.stderr}")

with open(SORTIE, "w", encoding="utf-8") as f:
    f.write("\n\n".join(parties))
