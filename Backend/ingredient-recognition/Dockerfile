FROM python:3.14-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY ingredient-recognition/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY ingredient-recognition/recognition.py ingredient-recognition/server.py ./
USER 65534:65534
EXPOSE 8090
CMD ["python", "server.py"]
