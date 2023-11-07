from django.urls import include, path
from rest_framework import routers
from .views import (FamiliarizationCaseViewSet, SidesCaseViewSet,
                    PetitionsViewSet, DecisionsViewSet,
                    ConsideredCaseViewSet, CategoryViewSet,
                    BusinessCardViewSet, AppealViewSet,
                    BusinessMovementViewSet
                    )


app_name = 'business_card'

router = routers.DefaultRouter()

router.register(r'familiarization',
                FamiliarizationCaseViewSet,
                basename='familiarization')
router.register(r'sides', SidesCaseViewSet, basename='sides')
router.register(r'petitions', PetitionsViewSet, basename='petitions')
router.register(r'decisions', DecisionsViewSet, basename='decisions')
router.register(r'considered', ConsideredCaseViewSet, basename='considered')
router.register(r'category', CategoryViewSet, basename='category')
router.register(r'businesscard', BusinessCardViewSet, basename='businesscard')
router.register(r'appeal', AppealViewSet, basename='appeal')
router.register(r'businessmovement',
                BusinessMovementViewSet,
                basename='businessmovement')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include('djoser.urls.authtoken')),
    path('', include('djoser.urls')),

]


'''
'business_card'

'profile'
'card_create'
'business_card_detail'

'card_edit'

'add_side'

'edit_side'

'delete_side'

'add_movement'

'edit_movement'

'delete_movement'

'add_petition'

'edit_petition'

'delete_petition'
'''
