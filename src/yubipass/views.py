from django.shortcuts import render
# Create your views here.
from django.views.generic import TemplateView


class IndexView(TemplateView):
    template_name = 'index.html'

class index_puni(TemplateView):
    template_name = 'index_puni.html'
