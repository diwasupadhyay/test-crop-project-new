FROM python:3.10-slim
WORKDIR /app

# Copy pre-downloaded wheels and install offline (no slow downloads)
COPY wheels/ /tmp/wheels/
COPY requirements.txt .
RUN pip install --no-index --find-links=/tmp/wheels/ -r requirements.txt && rm -rf /tmp/wheels/

COPY . .
RUN chmod +x entrypoint.sh
EXPOSE 5001
CMD ["bash", "entrypoint.sh"]