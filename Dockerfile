FROM python:latest

COPY requirement.txt  .
RUN pip install -r requirement.txt

COPY . . 

RUN python manage.py collectstatic

EXPOSE 8000
  
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# RUN python manage.py migrate