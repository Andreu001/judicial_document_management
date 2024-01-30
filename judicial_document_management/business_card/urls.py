from django.urls import include, path
from rest_framework import routers
from .views import (FamiliarizationCaseViewSet, SidesCaseViewSet,
                    PetitionsViewSet, PetitionsInCaseViewSet, DecisionsViewSet,
                    ConsideredCaseViewSet, CategoryViewSet,
                    BusinessCardViewSet, AppealViewSet,
                    BusinessMovementViewSet, SidesCaseInCaseViewSet
                    )


app_name = 'business_card'

router = routers.DefaultRouter()
# Ознакомление с мат. дела, скорей всего
# надо привязать к конкретной стороне по делу
router.register(r'familiarization',
                FamiliarizationCaseViewSet,
                basename='familiarization')
router.register(r'sides', SidesCaseViewSet, basename='sides')

router.register(
    r'businesscard/(?P<businesscard_id>\d+)/sidescaseincase',
    SidesCaseInCaseViewSet,
    basename='sidescaseincase'
    )

router.register(r'petitions', PetitionsViewSet, basename='petitions')
# Заявленные ходатайства надо привязать
# к делу и к лицу, которое заявило ходатайство
router.register(
    r'businesscard/(?P<businesscard_id>\d+)/petitionsincase',
    PetitionsInCaseViewSet,
    basename='petitionsincase')

# Вынесенные решения привязываются только к делу
router.register(
    r'businesscard/(?P<businesscard_id>\d+)/decisions',
    DecisionsViewSet, basename='decisions'
    )
# Действия по рассмотренному делу, привязываются только к делу
router.register(
    r'businesscard/(?P<businesscard_id>\d+)/considered',
    ConsideredCaseViewSet, basename='considered'
    )
router.register(r'category', CategoryViewSet, basename='category')
router.register(r'businesscard', BusinessCardViewSet, basename='businesscard')
# Апелляция так же привязывается только к делу
router.register(
    r'businesscard/(?P<businesscard_id>\d+)/appeal',
    AppealViewSet, basename='appeal'
    )
router.register(
    r'businesscard/(?P<businesscard_id>\d+)/businessmovement',
    BusinessMovementViewSet,
    basename='businessmovement')

urlpatterns = [
    path('', include(router.urls)),
]
