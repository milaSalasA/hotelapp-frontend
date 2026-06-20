import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from "@angular/router";
import { MenuService } from "../services/menu.service";
import { inject } from "@angular/core";
import { map } from "rxjs";
import { Menu } from "../model/menu";

export const certGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {

    const menuService = inject(MenuService);
    const router = inject(Router);

    return menuService.getMenusByUser().pipe(
        map((data: Menu[]) => {
            //Verificar si el usuario tiene acceso a la ruta solicitada
            const url = state.url;
            const hasAccess = data.some(menu => url.startsWith(menu.url));

            if(!hasAccess) {
                router.navigate(['/pages/not-403']);
                return false;
            }

            return true;
        })
    );
};