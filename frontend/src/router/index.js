import About from "../pages/About";
import CardIdPage from "../pages/CardIdPage";
import Cards from "../pages/Cards";


export const privateRoutes = [
    {path: '/about', component: About, exact: true},
    {path: '/cards', component: Cards, exact: true},
    {path: '/cards/:id', component: CardIdPage, exact: true},
]

export const publicRoutes = [
    {path: '/login', component: Login, exact: true},
]