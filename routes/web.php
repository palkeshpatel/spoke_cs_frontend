<?php

/** @var \Laravel\Lumen\Routing\Router $router */

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It is a breeze. Simply tell Lumen the URIs it should respond to
| and give it the Closure to call when that URI is requested.
|
*/

$router->get('/', function () use ($router) {
    return $router->app->version();
});

$router->group(['prefix' => 'api', 'namespace' => 'Api'], function () use ($router) {
    $router->get('customers', 'CustomerController@index');
    $router->post('customers', 'CustomerController@store');
    $router->get('customers/{id:[0-9]+}', 'CustomerController@show');
    $router->put('customers/{id:[0-9]+}', 'CustomerController@update');
    $router->delete('customers/{id:[0-9]+}', 'CustomerController@destroy');
    $router->post('customers/{id:[0-9]+}/body-profile', 'CustomerController@upsertBodyProfile');
    $router->post('customers/{id:[0-9]+}/body-images', 'CustomerController@addBodyImage');
    $router->delete('customers/{id:[0-9]+}/body-images/{imageId:[0-9]+}', 'CustomerController@deleteBodyImage');

    $router->get('appointment-services', 'AppointmentServiceController@index');
    $router->post('appointment-services', 'AppointmentServiceController@store');

    $router->get('appointments', 'AppointmentController@index');
    $router->post('appointments', 'AppointmentController@store');
    $router->get('appointments/{id:[0-9]+}', 'AppointmentController@show');
    $router->put('appointments/{id:[0-9]+}', 'AppointmentController@update');
    $router->delete('appointments/{id:[0-9]+}', 'AppointmentController@destroy');

    $router->get('measurement-fields', 'MeasurementFieldController@index');
    $router->post('measurement-fields', 'MeasurementFieldController@store');

    $router->get('measurements', 'MeasurementController@index');
    $router->post('measurements', 'MeasurementController@store');
    $router->get('measurements/{id:[0-9]+}', 'MeasurementController@show');
    $router->put('measurements/{id:[0-9]+}', 'MeasurementController@update');
    $router->delete('measurements/{id:[0-9]+}', 'MeasurementController@destroy');

    $router->get('orders', 'OrderController@index');
    $router->post('orders', 'OrderController@store');
    $router->get('orders/{id:[0-9]+}', 'OrderController@show');
    $router->put('orders/{id:[0-9]+}', 'OrderController@update');
    $router->delete('orders/{id:[0-9]+}', 'OrderController@destroy');

    $router->get('invoices', 'InvoiceController@index');
    $router->post('invoices', 'InvoiceController@store');
    $router->get('invoices/{id:[0-9]+}', 'InvoiceController@show');
    $router->put('invoices/{id:[0-9]+}', 'InvoiceController@update');
    $router->delete('invoices/{id:[0-9]+}', 'InvoiceController@destroy');
    $router->post('invoices/{id:[0-9]+}/payments', 'InvoiceController@addPayment');

    $router->get('staff', 'StaffController@index');
    $router->post('staff', 'StaffController@store');
});
