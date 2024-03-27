from django.db import models


class Upload1(models.Model):

    complain = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    address = models.CharField(max_length=200)
    link = models.CharField(max_length=500)
    area = models.CharField(max_length=100)

    class Meta:
        db_table = "U_Air_Pollution"


class Upload2(models.Model):

    complain = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    address = models.CharField(max_length=200)
    link = models.CharField(max_length=500)
    area = models.CharField(max_length=100)

    class Meta:
        db_table = "U_Electricity"


class Upload3(models.Model):

    complain = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    address = models.CharField(max_length=200)
    link = models.CharField(max_length=500)
    area = models.CharField(max_length=100)

    class Meta:
        db_table = "U_Road_Construction"


class Upload4(models.Model):

    complain = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    address = models.CharField(max_length=200)
    link = models.CharField(max_length=500)
    area = models.CharField(max_length=100)

    class Meta:
        db_table = "U_Sewage_&_Water_Logging"


class Upload5(models.Model):

    complain = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    address = models.CharField(max_length=200)
    link = models.CharField(max_length=500)
    area = models.CharField(max_length=100)

    class Meta:
        db_table = "U_Waste_Management"


class Upload6(models.Model):

    complain =  models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    address = models.CharField(max_length=200)
    link = models.CharField(max_length=500)
    area = models.CharField(max_length=100)

    class Meta:
        db_table = "U_Others"


class FeedBack(models.Model):

    problem = models.CharField(max_length=50)
    comment = models.CharField(max_length=1000)

    class Meta:
        db_table = "feedback"