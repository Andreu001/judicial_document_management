from django.core.paginator import Paginator

POSTS_NUMBER = 6


def paginator_list(request, business_card):

    paginator = Paginator(business_card, POSTS_NUMBER)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return page_obj
