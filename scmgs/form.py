from django import forms
from scmgs.models import *


class Upload1Form(forms.ModelForm):
    class Meta:
        model = Upload1
        fields = "__all__"


class Upload2Form(forms.ModelForm):
    class Meta:
        model = Upload2
        fields = "__all__"


class Upload3Form(forms.ModelForm):
    class Meta:
        model = Upload3
        fields = "__all__"


class Upload4Form(forms.ModelForm):
    class Meta:
        model = Upload4
        fields = "__all__"


class Upload5Form(forms.ModelForm):
    class Meta:
        model = Upload5
        fields = "__all__"

class Upload6Form(forms.ModelForm):
    class Meta:
        model = Upload6
        fields = "__all__"

class FeedBackForm(forms.ModelForm):
    class Meta:
        model = FeedBack
        fields = "__all__"


