FROM python:latest

COPY requirement.txt  .
RUN pip install -r requirement.txt

COPY . . 

RUN python manage.py collectstatic

EXPOSE 8000
