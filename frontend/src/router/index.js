import About from "../pages/About";
import CardIdPage from "../pages/CardIdPage";
import Cards from "../pages/Cards";


export const privateRoutes = [
    {path: '/about', component: About, exact: true},
    {path: '/profile', component: About, exact: true},
    {path: '/archive', component: About, exact: true},
    {path: '/cards', component: Cards, exact: true},
    {path: '/cards/:id', component: CardIdPage, exact: true},
    {path: '/sides/:id', component: CardIdPage, exact: true},
    {path: '/movements/:id', component: CardIdPage, exact: true},
    {path: '/considered/:id', component: CardIdPage, exact: true},
    {path: '/petition/:id', component: CardIdPage, exact: true},
]

export const publicRoutes = [
    {path: '/login', component: Login, exact: true},
]