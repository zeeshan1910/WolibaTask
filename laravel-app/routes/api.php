<?php

use App\Http\Controllers\CompanyController;
use App\Http\Controllers\CompanyUserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Token;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/




Route::get('/', function (Request $request) {
})->middleware('role:admin,super_admin');


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
