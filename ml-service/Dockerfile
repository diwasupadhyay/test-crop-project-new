FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --timeout=300 --retries=5 -r requirements.txt
COPY . .
EXPOSE 5001
CMD ["python", "api/app.py"]