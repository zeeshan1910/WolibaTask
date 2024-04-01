How to run a project
1. Clone and Unzip file and use xammp
2. create db with "new" name
3. Open laravel project
4. run composer install command
5. run php artisan migrate command
6. now open node js project
7. run npm install command
8. run node index.js / php artisan serve in laravel project
9. now test all apis


Node js Apis
1. /register for registering user
2. /login for login 
3. /verify for otp aith
4. /profile with post for profile details of user
5. /profile with update for profile update
6. /reset-password for resetting password
7. /reset-password/verify for otp reset
8. /update-password for changing pass
9. /profile-picture for profile pic upload

laravel apis
Route::get('/companies', [CompanyController::class, 'index'])->middleware('role:admin,super_admin');
Route::post('/companies', [CompanyController::class, 'store'])->middleware('role:admin,super_admin');
Route::get('/companies/{id}', [CompanyController::class, 'show'])->middleware('role:admin,super_admin');
Route::put('/companies/{id}', [CompanyController::class, 'update'])->middleware('role:admin,super_admin');
Route::delete('/companies/{id}', [CompanyController::class, 'destroy'])->middleware('role:admin,super_admin');

Route::get('/companies/{companyId}/users', [CompanyUserController::class, 'index'])->middleware('role:admin,super_admin');
Route::get('/companies/{companyId}/users/search', [CompanyUserController::class, 'search'])->middleware('role:admin,super_admin');
Route::put('/users/{userId}', [CompanyUserController::class, 'update'])->middleware('role:admin,super_admin');
Route::delete('/companies/{companyId}/users', [CompanyUserController::class, 'destroy'])->middleware('role:admin,super_admin');



// Import single user under a company
Route::post('/company/{companyId}/import-user', [CompanyUserController::class, 'importUser'])->middleware('role:admin,super_admin');

// API for Super Admin to give Admin access to any company user
Route::post('/company/{companyId}/give-admin-access/{userId}',  [CompanyUserController::class, 'giveAdminAccess'])->middleware('role:super_admin');
