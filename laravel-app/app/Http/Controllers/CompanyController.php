<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Token;

class CompanyController extends Controller
{
    public function index(Request $request)
    {
        $user = $this->get_current_user($request);

        if ($user['role'] === 'super_admin') {
            $companies = Company::all();
        }else{
            $adminId = $user['sub'];
            $companies = Company::whereJsonContains('admins_id', $adminId)->get();

        }
        return response()->json(['companies' => $companies], 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
        ]);

        $user = $this->get_current_user($request);
        
        $company = new Company();
        $company->company_name = $request->company_name;
        $company->admins_id = json_encode([$user['sub']]);
        $company->save();

        return response()->json(['company' => $company], 201);
    }

    public function show($id)
    {
        $company = Company::findOrFail($id);
        return response()->json(['company' => $company], 200);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
        ]);

        $company = Company::findOrFail($id);
        $company->company_name = $request->company_name;
        // Update other fields as needed
        $company->save();

        return response()->json(['company' => $company], 200);
    }

    public function destroy($id)
    {
        $company = Company::findOrFail($id);
        $company->delete();

        return response()->json('Deleted successfully', 204);
    }

    public function get_current_user(Request $request)
    {
        // Retrieve the JWT token from cookies
        $rawToken = $request->cookie('token');

        // Create a Token instance from the raw token string
        $token = new Token($rawToken);
        $user = JWTAuth::decode($token);

        return $user;
    }
}
