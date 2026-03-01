FROM python:3.10-slim
WORKDIR /app

# Copy pre-downloaded wheels and install offline (no slow downloads)
COPY wheels/ /tmp/wheels/
COPY requirements.txt .
RUN pip install --no-index --find-links=/tmp/wheels/ -r requirements.txt && rm -rf /tmp/wheels/

COPY . .
EXPOSE 5001
CMD ["python", "api/app.py"]