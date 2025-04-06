FROM python:3.9.21

WORKDIR /app

COPY requirements.txt /app/

RUN pip3 install --no-cache-dir -r requirements.txt

COPY . /app/

CMD [ "python3", "run_app.py"]