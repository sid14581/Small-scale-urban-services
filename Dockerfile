FROM python:latest

COPY requirement.txt  .
RUN pip install -r requirement.txt

COPY . . 

RUN python3 manage.py collectstatic

RUN python3 manage.py migrate

EXPOSE 8000
  
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]