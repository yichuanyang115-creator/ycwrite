FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN echo "force-rebuild-20260305"
COPY . .
# Validate imports at build time to catch stale cache issues early
RUN python -c "from scripts.progress_tracker import ProgressTracker; print('ProgressTracker import OK')"
CMD ["python", "api_server.py"]
