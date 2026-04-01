import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password').then(
        m => m.ResetPasswordComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/layout/layout').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then(
            m => m.DashboardComponent
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/user-list/user-list').then(
            m => m.UserListComponent
          ),
        canActivate: [adminGuard],
      },
      {
        path: 'users/:id',
        loadComponent: () =>
          import('./features/users/user-detail/user-detail').then(
            m => m.UserDetailComponent
          ),
        canActivate: [adminGuard],
      },
      {
      path: 'profile',
      loadComponent: () =>
        import('./features/profile/profile').then(
          m => m.ProfileComponent
        ),
      },
      // ─── Apps ──────────────────────────────────────────
      {
        path: 'apps',
        loadComponent: () =>
          import('./features/apps/app-list/app-list').then(
            m => m.AppListComponent
          ),
      },
      {
        path: 'apps/:id',
        loadComponent: () =>
          import('./features/apps/app-detail/app-detail').then(
            m => m.AppDetailComponent
          ),
      },
      {
        path: 'apps/:appId/checks/add',
        loadComponent: () =>
          import('./features/apps/add-check/add-check').then(
            m => m.AddCheckComponent
          ),
      },
      {
        path: 'apps/:appId/checks/:checkId',
        loadComponent: () =>
          import('./features/apps/check-detail/check-detail').then(
            m => m.CheckDetailComponent
          ),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },

    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
