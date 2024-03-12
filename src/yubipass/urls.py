from django.urls import path

from . import views

urlpatterns = [
    path('', views.IndexView.as_view(), name='index'),
    path('puni/', views.index_puni.as_view(), name='index_puni'),
]

